const fs = require('fs');
const path = require('path');
const config = require('../config');
const User = require('../models/User');
const { CompanyFinanceSettings, CompanyBankAccount } = require('../models/Invoice');
const { getCompanyRoot } = require('../utils/company');
const { mediaUrl } = require('../utils/serialize');

function fmtMoney(n) {
  return Number(n || 0).toFixed(2);
}

function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString('en-GB');
}

function fileUrlFromMedia(relativePath, baseUrl) {
  if (!relativePath) return '';
  if (relativePath.startsWith('http')) return relativePath;
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const abs = path.join(config.mediaRoot, normalized);
  if (fs.existsSync(abs)) {
    return `file:///${abs.replace(/\\/g, '/')}`;
  }
  if (baseUrl) return `${baseUrl}${config.mediaUrl}${normalized}`;
  return mediaUrl(relativePath);
}

function processItems(items, defaultSac) {
  return (items || []).map((item) => {
    let rate = 0;
    let quantity = 0;

    if (item.billing_type === 'BILLABLE_DAYS') {
      rate = item.monthly_rate || 0;
      quantity = item.working_days || 0;
    } else if (item.billing_type === 'HOURLY') {
      rate = item.hourly_rate || 0;
      quantity = item.total_hours || 0;
    } else {
      rate = item.amount || 0;
      quantity = 1;
    }

    return {
      title: item.title || '',
      description: item.description || '-',
      sac_code: item.sac_code || defaultSac || '-',
      rate,
      quantity,
      amount: item.amount || 0,
    };
  });
}

function buildItemRowsHtml(items) {
  return items
    .map(
      (item) => `
        <tr>
            <td>
                <span class="bold">${item.title}</span><br>
                <span style="font-size:10px; color:#666;">${item.description}</span>
            </td>
            <td>${item.sac_code}</td>
            <td class="right">${fmtMoney(item.rate)}</td>
            <td class="right">${fmtMoney(item.quantity)}</td>
            <td class="right">${fmtMoney(item.amount)}</td>
        </tr>`
    )
    .join('');
}

function renderInvoiceHtml(invoice, company, bank, items, baseUrl) {
  const templatePath = path.join(__dirname, '../templates/invoices/invoice_pdf.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  const logoUrl = fileUrlFromMedia(company?.logo, baseUrl);
  const signatureUrl = fileUrlFromMedia(company?.signature, baseUrl);

  const replacements = {
    LOGO_BLOCK: logoUrl
      ? `<img src="${logoUrl}" class="logo">`
      : '',
    COMPANY_NAME: company?.companyName || '',
    COMPANY_ADDRESS: company?.address || '',
    COMPANY_GSTIN: company?.gstin || '',
    COMPANY_PHONE: company?.phone || '',
    COMPANY_EMAIL: company?.email || '',
    INVOICE_NUMBER: invoice.invoiceNumber || '',
    INVOICE_DATE: fmtDate(invoice.invoiceDate),
    DUE_DATE: fmtDate(invoice.dueDate),
    BILL_TO_COMPANY: invoice.billToName || '',
    BILL_TO_ADDRESS: (invoice.billToAddress || '').replace(/\n/g, '<br>'),
    BILL_TO_GSTIN: invoice.billToGst || '-',
    ITEM_ROWS: buildItemRowsHtml(items),
    BANK_NAME: bank?.bankName || '',
    BANK_IFSC: bank?.ifscCode || '',
    BANK_ACCOUNT: bank?.accountNumber || '',
    BANK_HOLDER: bank?.accountHolderName || '',
    SUBTOTAL: fmtMoney(invoice.subtotal),
    GST_RATE: invoice.gstRate ?? 18,
    GST_AMOUNT: fmtMoney(invoice.gstAmount),
    TOTAL_AMOUNT: fmtMoney(invoice.totalAmount),
    TERMS_BLOCK: company?.defaultTerms
      ? `<div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 5px;"><strong>Terms & Conditions:</strong> <span style="font-size:10px;">${company.defaultTerms}</span></div>`
      : '',
    SIGNATURE_BLOCK: signatureUrl
      ? `<img src="${signatureUrl}" class="seal-img"><br>`
      : '',
  };

  for (const [key, value] of Object.entries(replacements)) {
    html = html.split(`{{${key}}}`).join(String(value ?? ''));
  }
  return html;
}

async function generateInvoicePdf(invoice, req) {
  const createdBy = invoice.createdById
    ? await User.findOne({ id: invoice.createdById })
    : null;
  const root = getCompanyRoot(createdBy) || (invoice.companyId ? { id: invoice.companyId } : null);
  const rootId = root?.id;
  if (!rootId) {
    const err = new Error('Could not resolve company for invoice PDF');
    err.code = 'COMPANY_NOT_FOUND';
    throw err;
  }

  const company = await CompanyFinanceSettings.findOne({ createdById: rootId });
  const bank = invoice.companyBankAccountId
    ? await CompanyBankAccount.findOne({ id: invoice.companyBankAccountId })
    : null;

  const baseUrl = req
    ? `${req.protocol}://${req.get('host')}`
    : process.env.API_BASE_URL || `http://localhost:${config.port}`;

  const processedItems = processItems(invoice.items, company?.defaultSacCode);
  const html = renderInvoiceHtml(invoice, company, bank, processedItems, baseUrl);

  const pdfDir = path.join(config.mediaRoot, 'invoices/generated');
  fs.mkdirSync(pdfDir, { recursive: true });

  const safeNumber = (invoice.invoiceNumber || `invoice-${invoice.id}`).replace(/[^\w.-]+/g, '_');
  const filename = `${safeNumber}.pdf`;
  const filepath = path.join(pdfDir, filename);

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    const err = new Error(
      'PDF engine not installed. Run npm install in backend-node (puppeteer required).'
    );
    err.code = 'PDF_ENGINE_MISSING';
    throw err;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: filepath,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
    });
  } finally {
    await browser.close();
  }

  const rel = `invoices/generated/${filename}`;
  invoice.pdfFile = rel;
  await invoice.save();

  return mediaUrl(rel);
}

module.exports = { generateInvoicePdf, renderInvoiceHtml };
