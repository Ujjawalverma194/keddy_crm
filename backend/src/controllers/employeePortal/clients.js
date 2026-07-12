const Client = require('../../models/Client');
const { drfPaginate, drfResponse } = require('../../utils/pagination');
const { clientToJSON, getUserMap } = require('../../utils/formatters');
const { relPath } = require('../../middleware/upload');

function parseBody(req) {
  const b = req.body || {};
  return {
    companyName: b.company_name,
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
  const companyId = req.body.company_id ? parseInt(req.body.company_id, 10) : null;
  
  let pocsRaw = [];
  try {
    pocsRaw = req.body.pocs ? JSON.parse(req.body.pocs) : [];
  } catch (e) {
    pocsRaw = [];
  }

  // Fallback for legacy requests
  if (pocsRaw.length === 0 && req.body.client_name) {
    pocsRaw = [{ name: req.body.client_name, number: req.body.phone_number, email: req.body.email, isPrimary: true }];
  }

  if (!data.companyName || pocsRaw.length === 0) {
    return res.status(400).json({ detail: 'Company name and at least one POC are required.' });
  }

  const files = req.files || {};
  const { ClientPOC } = require('../../models/sequelize/init');
  let doc;

  if (companyId) {
    doc = await Client.findOne({ id: companyId });
    if (doc) {
      for (const p of pocsRaw) {
        if (!p.name || !p.number) continue;
        let pocToUpdate;
        if (p.id) {
          pocToUpdate = await ClientPOC.findByPk(p.id);
        }
        if (!pocToUpdate) {
          pocToUpdate = await ClientPOC.findOne({ where: { clientId: doc.id, number: p.number } });
        }
        
        if (pocToUpdate) {
           let assigned = [...(pocToUpdate.assignedEmployeeIds || [])];
           if (!assigned.includes(req.user.id)) {
             assigned.push(req.user.id);
             await pocToUpdate.update({ assignedEmployeeIds: assigned });
           }
        } else {
          if (p.isPrimary) {
            await ClientPOC.update({ isPrimary: false }, { where: { clientId: doc.id } });
          }
          await ClientPOC.create({
            clientId: doc.id,
            name: p.name,
            number: p.number,
            email: p.email,
            isPrimary: p.isPrimary || false,
            assignedEmployeeIds: [req.user.id],
            isActive: true
          });
        }
      }
      
      const updates = {};
      if (data.officialEmail) updates.officialEmail = data.officialEmail;
      if (data.gstNumber) updates.gstNumber = data.gstNumber;
      if (data.billingAddress) updates.billingAddress = data.billingAddress;
      if (data.companyEmployeeCount) updates.companyEmployeeCount = data.companyEmployeeCount;
      if (data.accountHolderName) updates.accountHolderName = data.accountHolderName;
      if (data.bankName) updates.bankName = data.bankName;
      if (data.accountNumber) updates.accountNumber = data.accountNumber;
      if (data.ifscCode) updates.ifscCode = data.ifscCode;
      if (data.remark) updates.remark = data.remark;
      
      if (Object.keys(updates).length > 0) {
        await Client.updateOne({ id: doc.id }, updates);
      }
    }
  }

  if (!doc) {
    const primaryPoc = pocsRaw.find(p => p.isPrimary) || pocsRaw[0];
    doc = await Client.create({
      ...data,
      clientName: primaryPoc.name,
      phoneNumber: primaryPoc.number,
      email: primaryPoc.email,
      createdById: req.user.id,
      ndaDocument: files.nda_document?.[0] ? relPath(files.nda_document[0].path) : undefined,
      msaDocument: files.msa_document?.[0] ? relPath(files.msa_document[0].path) : undefined,
    });
    
    let isFirst = true;
    for (const p of pocsRaw) {
      if (!p.name || !p.number) continue;
      
      if (companyId) {
        const existing = await ClientPOC.findOne({
          where: { clientId: doc.id, number: p.number }
        });
        if (existing) {
          if (p.isPrimary) {
            await ClientPOC.update({ isPrimary: false }, { where: { clientId: doc.id } });
          }
          let assigned = existing.assignedEmployeeIds || [];
          if (!assigned.includes(req.user.id)) {
            assigned.push(req.user.id);
          }
          await existing.update({
            name: p.name,
            email: p.email,
            isPrimary: p.isPrimary || false,
            assignedEmployeeIds: assigned
          });
          continue;
        }
      }
      
      if (p.isPrimary || (isFirst && p.isPrimary !== false)) {
        await ClientPOC.update({ isPrimary: false }, { where: { clientId: doc.id } });
      }
      
      await ClientPOC.create({
        clientId: doc.id,
        name: p.name,
        number: p.number,
        email: p.email,
        isPrimary: p.isPrimary !== undefined ? p.isPrimary : isFirst,
        assignedEmployeeIds: [req.user.id],
        isActive: true
      });
      isFirst = false;
    }
  }

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

  const data = parseBody(req);
  let pocsRaw = [];
  try {
    pocsRaw = req.body.pocs ? JSON.parse(req.body.pocs) : [];
  } catch (e) {
    pocsRaw = [];
  }

  const primaryPoc = pocsRaw.find(p => p.isPrimary) || pocsRaw[0];
  if (primaryPoc) {
    data.clientName = primaryPoc.name;
    data.phoneNumber = primaryPoc.number;
    data.email = primaryPoc.email;
  }
  
  Object.assign(client, data);

  const files = req.files || {};
  if (files.nda_document?.[0]) client.ndaDocument = relPath(files.nda_document[0].path);
  if (files.msa_document?.[0]) client.msaDocument = relPath(files.msa_document[0].path);

  await client.save();

  if (pocsRaw.length > 0) {
    const { ClientPOC } = require('../../models/sequelize/init');
    const existingPocs = await ClientPOC.findAll({ where: { clientId: client.id } });
    const submittedIds = pocsRaw.filter(p => p.id).map(p => p.id);
    
    for (const existing of existingPocs) {
      if (!submittedIds.includes(existing.id)) {
        await existing.destroy();
      }
    }
    
    for (const p of pocsRaw) {
      if (!p.name || !p.number) continue;
      
      if (p.id) {
        const existing = existingPocs.find(e => e.id === p.id);
        if (existing) {
          await existing.update({
            name: p.name,
            number: p.number,
            email: p.email,
            isPrimary: p.isPrimary || false
          });
        }
      } else {
        await ClientPOC.create({
          clientId: client.id,
          name: p.name,
          number: p.number,
          email: p.email,
          isPrimary: p.isPrimary || false,
          isActive: true
        });
      }
    }
  }

  const userMap = await getUserMap([client.createdById]);
  return res.json(clientToJSON(client, userMap));
}

async function list(req, res) {
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const search = (req.query.search || "").trim();
  
  let targetIds = [req.user.id];
  if (req.user.isTeamLeader && req.headers['x-team-leader-mode'] === 'true') {
    const User = require('../../models/User');
    const teamMembers = await User.find({ teamLeaderId: req.user.id }).select('id');
    targetIds = targetIds.concat(teamMembers.map(u => u.id));
  }

  const { ClientPOC } = require('../../models/sequelize/init');
  const { Op } = require('sequelize');
  
  const pocs = await ClientPOC.findAll({
    where: {
      [Op.or]: targetIds.map(id => ({
        assignedEmployeeIds: { [Op.contains]: [id] }
      }))
    },
    attributes: ['clientId']
  });
  const assignedClientIds = [...new Set(pocs.map(p => p.clientId))];

  const $or = [{ createdById: { $in: targetIds } }];
  if (assignedClientIds.length > 0) {
    $or.push({ id: { $in: assignedClientIds } });
  }

  const filter = {
    isDeleted: false,
    $or,
  };
  
  if (search) {
    filter.$and = [
      {
        $or: [
          { clientName: new RegExp(search, 'i') },
          { companyName: new RegExp(search, 'i') },
        ],
      },
    ];
  }

  const [items, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Client.countDocuments(filter),
  ]);

  const userMap = await getUserMap(items.map((c) => c.createdById));
  return res.json(drfResponse(items.map((c) => clientToJSON(c, userMap)), total, page, pageSize));
}

async function detail(req, res) {
  const { ClientPOC } = require('../../models/sequelize/init');
  const client = await Client.rawModel.findOne({
    where: { id: parseInt(req.params.client_id, 10), is_deleted: false },
    include: [{ model: ClientPOC, as: 'pocs', required: false }]
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
  const { buildEmployeeFilter, employeeToDropdownJSON } = require('../../utils/employeeQuery');

  const root = getCompanyRoot(req.user);
  if (!root) {
    return res.json([]);
  }

  const companyAdminId = root.id || req.user.id;
  const search = (req.query.search || '').trim();

  const users = await User.find(buildEmployeeFilter(companyAdminId, search));

  return res.json(users.map(employeeToDropdownJSON));
}

async function checkDuplicate(req, res) {
  const { client_name, company_name, phone_number } = req.body;
  
  if (!client_name && !company_name && !phone_number) {
    return res.json({ duplicate: false });
  }

  const { Op } = require('sequelize');

  const orConditions = [];
  if (client_name && client_name.trim() !== '') {
    orConditions.push({ clientName: { [Op.iLike]: `%${client_name.trim()}%` } });
  }
  if (company_name && company_name.trim() !== '') {
    orConditions.push({ companyName: { [Op.iLike]: `%${company_name.trim()}%` } });
  }
  if (phone_number && phone_number.trim() !== '') {
    orConditions.push({ phoneNumber: phone_number.trim() });
  }

  if (orConditions.length === 0) {
    return res.json({ duplicate: false });
  }

  const filterOrOptions = {
    where: {
      isDeleted: false,
      [Op.or]: orConditions
    }
  };

  try {
    const existingClient = await Client.findOne(filterOrOptions);
    if (existingClient) {
      const userMap = await getUserMap([existingClient.createdById]);
      return res.json({ 
        duplicate: true, 
        client: clientToJSON(existingClient, userMap) 
      });
    }
    return res.json({ duplicate: false });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return res.json({ duplicate: false });
  }
}

async function searchClients(req, res) {
  const { q } = req.query;
  const { ClientPOC } = require('../../models/sequelize/init');
  const { Op } = require('sequelize');
  
  const filter = { isDeleted: false };
  if (q) {
    filter.companyName = { [Op.iLike]: `%${q}%` };
  }
  const items = await Client.rawModel.findAll({
    where: filter,
    limit: 10,
    include: [{ model: ClientPOC, as: 'pocs', required: false }]
  });
  return res.json(items.map((c) => clientToJSON(c, new Map())));
}

module.exports = {
  create,
  update,
  list,
  detail,
  softDelete,
  toggleVerify,
  employees,
  checkDuplicate,
  searchClients,
};