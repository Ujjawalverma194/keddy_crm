// const Client = require('../../models/Client');
// const { getCompanyUserIds } = require('../../utils/company');
// const { drfPaginate, drfResponse } = require('../../utils/pagination');
// const { clientToJSON, getUserMap } = require('../../utils/formatters');
// const { relPath } = require('../../middleware/upload');

// function parseBody(req) {
//   const b = req.body || {};
//   return {
//     clientName: b.client_name,
//     companyName: b.company_name,
//     phoneNumber: b.phone_number,
//     email: b.email,
//     gstNumber: b.gst_number,
//     billingAddress: b.billing_address,
//     accountHolderName: b.account_holder_name,
//     bankName: b.bank_name,
//     accountNumber: b.account_number,
//     ifscCode: b.ifsc_code,
//     remark: b.remark,
//     officialEmail: b.official_email,
//     sendingEmailId: b.sending_email_id,
//     companyEmployeeCount: b.company_employee_count ? parseInt(b.company_employee_count, 10) : undefined,
//     ndaStatus: b.nda_status,
//     msaStatus: b.msa_status,
//   };
// }

// async function create(req, res) {
//   const data = parseBody(req);
//   if (!data.clientName || !data.companyName || !data.phoneNumber) {
//     return res.status(400).json({ client_name: ['Required fields missing.'] });
//   }
//   const files = req.files || {};
//   const doc = await Client.create({
//     ...data,
//     createdById: req.user.id,
//     ndaDocument: files.nda_document?.[0] ? relPath(files.nda_document[0].path) : undefined,
//     msaDocument: files.msa_document?.[0] ? relPath(files.msa_document[0].path) : undefined,
//   });
//   const userMap = await getUserMap([doc.createdById]);
//   return res.status(201).json(clientToJSON(doc, userMap));
// }

// async function update(req, res) {
//   const client = await Client.findOne({ id: parseInt(req.params.client_id, 10), isDeleted: false });
//   if (!client) return res.status(404).json({ detail: 'Not found.' });
//   Object.assign(client, parseBody(req));
//   const files = req.files || {};
//   if (files.nda_document?.[0]) client.ndaDocument = relPath(files.nda_document[0].path);
//   if (files.msa_document?.[0]) client.msaDocument = relPath(files.msa_document[0].path);
//   await client.save();
//   const userMap = await getUserMap([client.createdById]);
//   return res.json(clientToJSON(client, userMap));
// }

// async function list(req, res) {
//   const companyIds = await getCompanyUserIds(req.user);
//   const { page, pageSize, skip, limit } = drfPaginate(req.query);
//   const search = (req.query.search || '').trim();

//   // Company pool: clients created by sub-admin/team + explicitly assigned to this employee
//   const filter = {
//     isDeleted: false,
//     $or: [
//       { createdById: { $in: companyIds } },
//       { assignedEmployeeIds: req.user.id },
//     ],
//   };
//   if (search) {
//     filter.$and = [
//       {
//         $or: [
//           { clientName: new RegExp(search, 'i') },
//           { companyName: new RegExp(search, 'i') },
//         ],
//       },
//     ];
//   }
//   const [items, total] = await Promise.all([
//     Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
//     Client.countDocuments(filter),
//   ]);
//   const userMap = await getUserMap(items.map((c) => c.createdById));
//   return res.json(drfResponse(items.map((c) => clientToJSON(c, userMap)), total, page, pageSize));
// }

// async function detail(req, res) {
//   const client = await Client.findOne({ id: parseInt(req.params.client_id, 10), isDeleted: false });
//   if (!client) return res.status(404).json({ detail: 'Not found.' });
//   const userMap = await getUserMap([client.createdById]);
//   return res.json(clientToJSON(client, userMap));
// }

// async function softDelete(req, res) {
//   const client = await Client.findOne({ id: parseInt(req.params.client_id, 10) });
//   if (!client) return res.status(404).json({ detail: 'Not found.' });
//   client.isDeleted = true;
//   await client.save();
//   return res.json({ message: 'Client deleted successfully' });
// }

// async function toggleVerify(req, res) {
//   if (req.user.role !== 'SUB_ADMIN') return res.status(403).json({ detail: 'Forbidden' });
//   const client = await Client.findOne({ id: parseInt(req.params.client_id, 10), isDeleted: false });
//   if (!client) return res.status(404).json({ detail: 'Not found.' });
//   client.isVerified = !client.isVerified;
//   await client.save();
//   return res.json({ message: 'Verification updated', data: { is_verified: client.isVerified } });
// }

// async function employees(req, res) {
//   const { getCompanyRoot } = require('../../utils/company');
//   const User = require('../../models/User');
//   const { buildEmployeeFilter, employeeToDropdownJSON } = require('../../utils/employeeQuery');

//   const root = getCompanyRoot(req.user);
//   if (!root) return res.json([]);

//   const companyAdminId = root.id || req.user.id;
//   const search = (req.query.search || '').trim();
//   const users = await User.find(buildEmployeeFilter(companyAdminId, search));
//   return res.json(users.map(employeeToDropdownJSON));
// }

// module.exports = { create, update, list, detail, softDelete, toggleVerify, employees };

const Client = require('../../models/Client');
const { drfPaginate, drfResponse } = require('../../utils/pagination');
const { clientToJSON, getUserMap } = require('../../utils/formatters');
const { relPath } = require('../../middleware/upload');

function parseBody(req) {
  const b = req.body || {};
  return {
    clientName: b.client_name,
    companyName: b.company_name,
    phoneNumber: b.phone_number,
    email: b.email,
    gstNumber: b.gst_number,
    billingAddress: b.billing_address,
    accountHolderName: b.account_holder_name,
    bankName: b.bank_name,
    accountNumber: b.account_number,
    ifscCode: b.ifsc_code,
    remark: b.remark,
    officialEmail: b.official_email,
    sendingEmailId: b.sending_email_id,
    companyEmployeeCount: b.company_employee_count
      ? parseInt(b.company_employee_count, 10)
      : undefined,
    ndaStatus: b.nda_status,
    msaStatus: b.msa_status,
  };
}

async function create(req, res) {
  const data = parseBody(req);

  if (!data.clientName || !data.companyName || !data.phoneNumber) {
    return res.status(400).json({
      client_name: ['Required fields missing.'],
    });
  }

  const files = req.files || {};

  const doc = await Client.create({
    ...data,
    createdById: req.user.id,
    ndaDocument: files.nda_document?.[0]
      ? relPath(files.nda_document[0].path)
      : undefined,
    msaDocument: files.msa_document?.[0]
      ? relPath(files.msa_document[0].path)
      : undefined,
  });

  const userMap = await getUserMap([doc.createdById]);
  return res.status(201).json(clientToJSON(doc, userMap));
}

async function update(req, res) {
  const client = await Client.findOne({
    id: parseInt(req.params.client_id, 10),
    isDeleted: false,
    createdById: req.user.id,
  });

  if (!client) {
    return res.status(404).json({ detail: 'Not found.' });
  }

  Object.assign(client, parseBody(req));

  const files = req.files || {};

  if (files.nda_document?.[0]) {
    client.ndaDocument = relPath(files.nda_document[0].path);
  }

  if (files.msa_document?.[0]) {
    client.msaDocument = relPath(files.msa_document[0].path);
  }

  await client.save();

  const userMap = await getUserMap([client.createdById]);
  return res.json(clientToJSON(client, userMap));
}

async function list(req, res) {
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const search = (req.query.search || '').trim();

  // ✅ Sirf logged-in employee ke created clients
  const filter = {
    isDeleted: false,
    createdById: req.user.id,
  };

  if (search) {
    filter.$or = [
      { clientName: new RegExp(search, 'i') },
      { companyName: new RegExp(search, 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Client.countDocuments(filter),
  ]);

  const userMap = await getUserMap(items.map((c) => c.createdById));

  return res.json(
    drfResponse(
      items.map((c) => clientToJSON(c, userMap)),
      total,
      page,
      pageSize
    )
  );
}

async function detail(req, res) {
  const client = await Client.findOne({
    id: parseInt(req.params.client_id, 10),
    isDeleted: false,
    createdById: req.user.id,
  });

  if (!client) {
    return res.status(404).json({ detail: 'Not found.' });
  }

  const userMap = await getUserMap([client.createdById]);
  return res.json(clientToJSON(client, userMap));
}

async function softDelete(req, res) {
  const client = await Client.findOne({
    id: parseInt(req.params.client_id, 10),
    isDeleted: false,
    createdById: req.user.id,
  });

  if (!client) {
    return res.status(404).json({ detail: 'Not found.' });
  }

  client.isDeleted = true;
  await client.save();

  return res.json({
    message: 'Client deleted successfully',
  });
}

async function toggleVerify(req, res) {
  if (req.user.role !== 'SUB_ADMIN') {
    return res.status(403).json({ detail: 'Forbidden' });
  }

  const client = await Client.findOne({
    id: parseInt(req.params.client_id, 10),
    isDeleted: false,
  });

  if (!client) {
    return res.status(404).json({ detail: 'Not found.' });
  }

  client.isVerified = !client.isVerified;
  await client.save();

  return res.json({
    message: 'Verification updated',
    data: {
      is_verified: client.isVerified,
    },
  });
}

async function employees(req, res) {
  const { getCompanyRoot } = require('../../utils/company');
  const User = require('../../models/User');
  const {
    buildEmployeeFilter,
    employeeToDropdownJSON,
  } = require('../../utils/employeeQuery');

  const root = getCompanyRoot(req.user);

  if (!root) {
    return res.json([]);
  }

  const companyAdminId = root.id || req.user.id;
  const search = (req.query.search || '').trim();

  const users = await User.find(buildEmployeeFilter(companyAdminId, search));

  return res.json(users.map(employeeToDropdownJSON));
}

module.exports = {
  create,
  update,
  list,
  detail,
  softDelete,
  toggleVerify,
  employees,
};