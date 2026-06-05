const { generateInvoicePdf } = require('../services/invoicePdfGenerator');
const {
  Invoice,
  InvoicePayment,
  CompanyFinanceSettings,
  CompanyBankAccount,
} = require('../models/Invoice');
const Candidate = require('../models/Candidate');
const Client = require('../models/Client');
const { resolveCompanyId, getCompanyUserIds } = require('../utils/company');
const { drfPaginate, drfResponse } = require('../utils/pagination');
const { clientToJSON } = require('../utils/formatters');
const { mediaUrl } = require('../utils/serialize');
const { relPath } = require('../middleware/upload');
const config = require('../config');

async function nextInvoiceNumber(companyId) {
  let count = await Invoice.countDocuments({ companyId });
  let invoiceNumber;
  let exists = true;
  while (exists) {
    count++;
    invoiceNumber = `INV-${companyId}-${String(count).padStart(5, '0')}`;
    const duplicate = await Invoice.findOne({ invoiceNumber });
    if (!duplicate) {
      exists = false;
    }
  }
  return invoiceNumber;
}

function calcInvoiceTotals(items, gstRate = 18) {
  let subtotal = 0;
  for (const i of (items || [])) {
    let amount = 0;
    if (i.billing_type === "BILLABLE_DAYS") {
      amount = ((parseFloat(i.monthly_rate) || 0) / (parseFloat(i.total_days) || 1)) * (parseFloat(i.working_days) || 0);
    } else if (i.billing_type === "HOURLY") {
      amount = (parseFloat(i.hourly_rate) || 0) * (parseFloat(i.total_hours) || 0);
    } else {
      amount = parseFloat(i.amount) || 0;
    }
    i.amount = Math.round(amount * 100) / 100;
    subtotal += i.amount;
  }
  const gstAmount = (subtotal * gstRate) / 100;
  return { subtotal, gstAmount, totalAmount: subtotal + gstAmount };
}

async function create(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const body = req.body;
  const items = typeof body.items === 'string' ? JSON.parse(body.items) : body.items || [];
  const gstRate = parseFloat(body.gst_rate || 18);
  const totals = calcInvoiceTotals(items, gstRate);

  const candidateId = body.candidate 
    ? parseInt(body.candidate, 10) 
    : (items.length > 0 && items[0].candidate ? parseInt(items[0].candidate, 10) : null);

  const invoice = await Invoice.create({
    invoiceType: body.invoice_type || 'CUSTOM',
    billingType: body.billing_type || 'MANUAL',
    invoiceNumber: await nextInvoiceNumber(companyId),
    candidateId,
    clientId: body.client ? parseInt(body.client, 10) : null,
    vendorId: body.vendor ? parseInt(body.vendor, 10) : null,
    companyBankAccountId: body.company_bank_account
      ? parseInt(body.company_bank_account, 10)
      : null,
    createdById: req.user.id,
    companyId,
    billToName: body.bill_to_name,
    billToAddress: body.bill_to_address,
    billToGst: body.bill_to_gst,
    invoiceDate: body.invoice_date ? new Date(body.invoice_date) : new Date(),
    dueDate: body.due_date ? new Date(body.due_date) : null,
    subtotal: totals.subtotal,
    gstRate,
    gstAmount: totals.gstAmount,
    totalAmount: totals.totalAmount,
    tds: parseFloat(body.tds || 0),
    vendorCost: parseFloat(body.vendor_cost || 0),
    items,
    notes: body.notes,
    status: 'DRAFT',
    paymentStatus: 'UNPAID',
  });

  invoice.margin = invoice.totalAmount - invoice.vendorCost;
  invoice.tdsAmount = (invoice.totalAmount * invoice.tds) / 100;
  await invoice.save();

  return res.status(201).json({ invoice_id: invoice.id, id: invoice.id });
}

async function listAll(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const search = (req.query.search || '').trim();
  const filter = { isDeleted: false, companyId };

  if (search) {
    // Search matching clients
    const matchingClients = await Client.find({
      isDeleted: false,
      $or: [
        { clientName: new RegExp(search, 'i') },
        { companyName: new RegExp(search, 'i') }
      ]
    });
    const matchingClientIds = matchingClients.map(c => c.id);

    // Search matching candidates
    const matchingCandidates = await Candidate.find({
      isDeleted: false,
      candidateName: new RegExp(search, 'i')
    });
    const matchingCandidateIds = matchingCandidates.map(c => c.id);

    filter.$or = [
      { invoiceNumber: new RegExp(search, 'i') },
      { billToName: new RegExp(search, 'i') },
      { clientId: { $in: matchingClientIds } },
      { candidateId: { $in: matchingCandidateIds } }
    ];
  }

  const [items, total] = await Promise.all([
    Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Invoice.countDocuments(filter),
  ]);

  // Bulk fetch Clients
  const clientIds = [...new Set(items.map(i => i.clientId).filter(Boolean))];
  const clients = clientIds.length ? await Client.find({ id: { $in: clientIds } }) : [];
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.companyName || c.clientName || '']));

  // Bulk fetch Candidates
  const candidateIds = [];
  for (const i of items) {
    if (i.candidateId) candidateIds.push(i.candidateId);
    if (Array.isArray(i.items)) {
      for (const item of i.items) {
        if (item.candidate) candidateIds.push(item.candidate);
      }
    }
  }
  const uniqueCandidateIds = [...new Set(candidateIds.filter(Boolean))];
  const candidates = uniqueCandidateIds.length ? await Candidate.find({ id: { $in: uniqueCandidateIds } }) : [];
  const candidateMap = Object.fromEntries(candidates.map(c => [c.id, c.candidateName || '']));

  const results = items.map((i) => {
    const bill_to_company = clientMap[i.clientId] || i.billToName || '-';

    const invoiceCandidateIds = [];
    if (i.candidateId) invoiceCandidateIds.push(i.candidateId);
    if (Array.isArray(i.items)) {
      for (const item of i.items) {
        if (item.candidate) invoiceCandidateIds.push(item.candidate);
      }
    }
    const uniqueInvoiceCandidateIds = [...new Set(invoiceCandidateIds.filter(Boolean))];
    const candidateNamesList = uniqueInvoiceCandidateIds
      .map(id => candidateMap[id])
      .filter(Boolean);
    const candidate_names = candidateNamesList.length ? candidateNamesList.join(', ') : '-';

    return {
      id: i.id,
      invoice_number: i.invoiceNumber,
      invoice_type: i.invoiceType,
      invoice_date: i.invoiceDate || i.createdAt,
      due_date: i.dueDate,
      total_amount: i.totalAmount,
      status: i.status,
      payment_status: i.paymentStatus,
      pdf_file: mediaUrl(i.pdfFile),
      pdf_url: mediaUrl(i.pdfFile),
      created_at: i.createdAt,
      bill_to_company,
      candidate_names,
    };
  });

  return res.json(drfResponse(results, total, page, pageSize));
}

async function retrieve(req, res) {
  const invoice = await Invoice.findOne({ id: parseInt(req.params.pk, 10), isDeleted: false });
  if (!invoice) return res.status(404).json({ detail: 'Not found' });
  return res.json({
    id: invoice.id,
    invoice_number: invoice.invoiceNumber,
    invoice_type: invoice.invoiceType,
    billing_type: invoice.billingType,
    items: invoice.items,
    subtotal: invoice.subtotal,
    gst_rate: invoice.gstRate,
    gst_amount: invoice.gstAmount,
    total_amount: invoice.totalAmount,
    status: invoice.status,
    payment_status: invoice.paymentStatus,
    candidate: invoice.candidateId,
    client: invoice.clientId,
    vendor: invoice.vendorId,
    pdf_file: mediaUrl(invoice.pdfFile),
  });
}

async function updateInvoice(req, res) {
  const invoice = await Invoice.findOne({ id: parseInt(req.params.pk, 10) });
  if (!invoice) return res.status(404).json({ detail: 'Not found' });
  const body = req.body;
  if (body.items) {
    const items = typeof body.items === 'string' ? JSON.parse(body.items) : body.items;
    const totals = calcInvoiceTotals(items, body.gst_rate || invoice.gstRate);
    invoice.items = items;
    invoice.subtotal = totals.subtotal;
    invoice.gstAmount = totals.gstAmount;
    invoice.totalAmount = totals.totalAmount;
    if (items.length > 0 && items[0].candidate) {
      invoice.candidateId = parseInt(items[0].candidate, 10);
    }
  }
  if (body.status) invoice.status = body.status;
  await invoice.save();
  return res.json({ success: true, message: 'Updated' });
}

async function updateStatus(req, res) {
  await Invoice.updateOne(
    { id: parseInt(req.params.id, 10) },
    { status: req.body.status }
  );
  return res.json({ success: true, message: 'Status updated' });
}

async function softDelete(req, res) {
  await Invoice.updateOne({ id: parseInt(req.params.id, 10) }, { isDeleted: true });
  return res.json({ success: true, message: 'Deleted' });
}

async function hardDelete(req, res) {
  await Invoice.deleteOne({ id: parseInt(req.params.id, 10) });
  return res.json({ success: true, message: 'Invoice permanently deleted' });
}

async function generatePdf(req, res) {
  try {
    const invoice = await Invoice.findOne({ id: parseInt(req.params.id, 10), isDeleted: false });
    if (!invoice) return res.status(404).json({ detail: 'Not found' });

    const pdfUrl = await generateInvoicePdf(invoice, req);
    return res.json({ message: 'PDF generated successfully', pdf_url: pdfUrl });
  } catch (err) {
    console.error('generatePdf error:', err);
    if (err.code === 'PDF_ENGINE_MISSING') {
      return res.status(503).json({ detail: err.message });
    }
    return res.status(500).json({ detail: 'Failed to generate PDF' });
  }
}

async function preview(req, res) {
  const invoice = await Invoice.findOne({ id: parseInt(req.params.id, 10) });
  if (!invoice) return res.status(404).json({ detail: 'Not found' });
  return res.json({ id: invoice.id, total_amount: invoice.totalAmount, items: invoice.items });
}

async function financeSettingsGet(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  let settings = await CompanyFinanceSettings.findOne({ createdById: companyId });
  if (!settings) {
    settings = await CompanyFinanceSettings.create({
      createdById: companyId,
      companyName: 'Company',
      address: '',
      gstin: '',
    });
  }
  return res.json({
    company_name: settings.companyName,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    gstin: settings.gstin,
    logo: mediaUrl(settings.logo),
    signature: mediaUrl(settings.signature),
    default_gst_rate: settings.defaultGstRate,
    default_sac_code: settings.defaultSacCode,
    default_terms: settings.defaultTerms,
  });
}

async function financeSettingsPut(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  let settings = await CompanyFinanceSettings.findOne({ createdById: companyId });
  const b = req.body;
  if (!settings) {
    settings = CompanyFinanceSettings.build({ createdById: companyId });
  }
  settings.companyName = b.company_name || settings.companyName;
  settings.address = b.address || settings.address;
  settings.phone = b.phone;
  settings.email = b.email;
  settings.gstin = b.gstin || settings.gstin;
  if (req.files?.logo?.[0]) settings.logo = relPath(req.files.logo[0].path);
  if (req.files?.signature?.[0]) settings.signature = relPath(req.files.signature[0].path);
  await settings.save();
  return res.json({ success: true, message: 'Settings saved' });
}

async function listBankAccounts(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const items = await CompanyBankAccount.find({ companyOwnerId: companyId, isActive: true });
  return res.json({
    results: items.map((b) => ({
      id: b.id,
      account_holder_name: b.accountHolderName,
      bank_name: b.bankName,
      account_number: b.accountNumber,
      ifsc_code: b.ifscCode,
      branch: b.branch,
    })),
  });
}

async function createBankAccount(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const b = req.body;
  const account = await CompanyBankAccount.create({
    companyOwnerId: companyId,
    accountHolderName: b.account_holder_name,
    bankName: b.bank_name,
    accountNumber: b.account_number,
    ifscCode: b.ifsc_code,
    branch: b.branch,
  });
  return res.status(201).json({ id: account.id });
}

async function financeDashboard(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const invoices = await Invoice.find({ companyId, isDeleted: false });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const fmt = (d) => d.toISOString().slice(0, 10);

  const inCurrentMonth = (inv) => {
    const d = inv.invoiceDate || inv.createdAt;
    return d && d >= monthStart && d <= monthEnd;
  };

  const monthInvoices = invoices.filter(inCurrentMonth);
  const monthRevenue = monthInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const monthExpense = monthInvoices.reduce((s, i) => s + (Number(i.vendorCost) || 0), 0);

  const unpaidInvoices = invoices.filter((i) => i.paymentStatus !== 'PAID');
  const receivedThisMonth = monthInvoices
    .filter((i) => i.paymentStatus === 'PAID')
    .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const pendingClient = unpaidInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const vendorPayable = unpaidInvoices.reduce((s, i) => s + (Number(i.vendorCost) || 0), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = invoices.filter((i) => {
    if (!i.dueDate || i.paymentStatus === 'PAID') return false;
    return new Date(i.dueDate) < today;
  });
  const dueSoon = invoices.filter((i) => {
    if (!i.dueDate || i.paymentStatus === 'PAID') return false;
    const due = new Date(i.dueDate);
    const days = (due - today) / 86400000;
    return days >= 0 && days <= 7;
  });

  const monthlyMap = {};
  for (const inv of invoices) {
    const d = inv.invoiceDate || inv.createdAt;
    if (!d) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, revenue: 0, expense: 0, profit: 0 };
    monthlyMap[key].revenue += Number(inv.totalAmount) || 0;
    monthlyMap[key].expense += Number(inv.vendorCost) || 0;
  }
  const monthly_comparison = Object.values(monthlyMap)
    .map((m) => ({ ...m, profit: m.revenue - m.expense }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const clientIds = [...new Set(invoices.map((i) => i.clientId).filter(Boolean))];
  const clients = clientIds.length ? await Client.find({ id: { $in: clientIds } }) : [];
  const clientMap = Object.fromEntries(
    clients.map((c) => [c.id, c.clientName || c.companyName || '—'])
  );

  const recent_client_invoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 10)
    .map((i) => ({
      id: i.id,
      invoice_id: i.invoiceNumber,
      client: clientMap[i.clientId] || i.billToName || '—',
      amount: Number(i.totalAmount) || 0,
      status: i.paymentStatus || i.status || 'UNPAID',
    }));

  let bankBalance = 0;
  const settings = await CompanyFinanceSettings.findOne({ createdById: companyId });
  if (settings?.bankBalance != null) bankBalance = Number(settings.bankBalance) || 0;

  return res.json({
    success: true,
    filters_available: {
      current_month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      date_range: { from: fmt(monthStart), to: fmt(monthEnd) },
    },
    kpi_cards: {
      this_month_revenue: { value: monthRevenue },
      this_month_expense: { value: monthExpense },
      net_profit: { value: monthRevenue - monthExpense },
      bank_balance: { value: bankBalance },
    },
    cash_flow: {
      received_this_month: receivedThisMonth,
      pending_client_payments: pendingClient,
      vendor_payable: vendorPayable,
    },
    alerts: {
      overdue: { client_invoices_count: overdue.length },
      due_soon: { client_invoices_count: dueSoon.length },
    },
    future_projection: {
      expected_profit: monthRevenue - monthExpense,
    },
    charts: { monthly_comparison },
    tables: { recent_client_invoices },
  });
}

async function listFinanceClients(req, res) {
  const companyIds = await getCompanyUserIds(req.user);
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const search = (req.query.search || '').trim();
  const filter = { isDeleted: false, createdById: { $in: companyIds } };
  if (search) {
    filter.$or = [
      { clientName: new RegExp(search, 'i') },
      { companyName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }
  const [items, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Client.countDocuments(filter),
  ]);
  return res.json(drfResponse(items.map((c) => clientToJSON(c)), total, page, pageSize));
}

async function createFinanceClient(req, res) {
  const b = req.body || {};
  if (!b.client_name?.trim() || !b.company_name?.trim()) {
    return res.status(400).json({ detail: 'Client name and company name are required.' });
  }
  const doc = await Client.create({
    clientName: b.client_name.trim(),
    companyName: b.company_name.trim(),
    phoneNumber: b.phone_number || '',
    email: b.email || '',
    gstNumber: b.gst_number || '',
    billingAddress: b.billing_address || '',
    accountHolderName: b.account_holder_name,
    bankName: b.bank_name,
    accountNumber: b.account_number,
    ifscCode: b.ifsc_code,
    createdById: req.user.id,
  });
  return res.status(201).json(clientToJSON(doc));
}

async function updateFinanceClient(req, res) {
  const companyIds = await getCompanyUserIds(req.user);
  const client = await Client.findOne({
    id: parseInt(req.params.client_id, 10),
    isDeleted: false,
    createdById: { $in: companyIds },
  });
  if (!client) return res.status(404).json({ detail: 'Not found.' });
  const b = req.body || {};
  if (b.client_name !== undefined) client.clientName = b.client_name;
  if (b.company_name !== undefined) client.companyName = b.company_name;
  if (b.phone_number !== undefined) client.phoneNumber = b.phone_number;
  if (b.email !== undefined) client.email = b.email;
  if (b.gst_number !== undefined) client.gstNumber = b.gst_number;
  if (b.billing_address !== undefined) client.billingAddress = b.billing_address;
  if (b.account_holder_name !== undefined) client.accountHolderName = b.account_holder_name;
  if (b.bank_name !== undefined) client.bankName = b.bank_name;
  if (b.account_number !== undefined) client.accountNumber = b.account_number;
  if (b.ifsc_code !== undefined) client.ifscCode = b.ifsc_code;
  await client.save();
  return res.json(clientToJSON(client));
}

async function clientCandidates(req, res) {
  const companyIds = await getCompanyUserIds(req.user);
  const clientId = parseInt(req.params.client_id, 10);
  const search = (req.query.search || '').trim();
  const client = await Client.findOne({
    id: clientId,
    isDeleted: false,
    createdById: { $in: companyIds },
  });
  if (!client) return res.status(404).json({ results: [], count: 0 });

  const filter = {
    clientId,
    mainStatus: 'ONBORD',
    isDeleted: false,
  };
  if (search) {
    filter.$or = [
      { candidateName: new RegExp(search, 'i') },
      { technology: new RegExp(search, 'i') },
    ];
  }
  const items = await Candidate.find(filter).sort({ createdAt: -1 });
  const results = items.map((c) => ({
    id: c.id,
    candidate_name: c.candidateName,
    technology: c.technology,
    client_rate: c.clientRate,
    default_billing_rate: c.clientRate || c.defaultBillingRate,
  }));
  return res.json({ results, count: results.length, next: null, previous: null });
}

module.exports = {
  create,
  listAll,
  retrieve,
  updateInvoice,
  updateStatus,
  softDelete,
  hardDelete,
  generatePdf,
  preview,
  financeSettingsGet,
  financeSettingsPut,
  listBankAccounts,
  createBankAccount,
  financeDashboard,
  listFinanceClients,
  createFinanceClient,
  updateFinanceClient,
  clientCandidates,
};
