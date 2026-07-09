const Vendor = require('../../models/Vendor');
const Candidate = require('../../models/Candidate');
const { getCompanyUserIds, resolveCompanyId } = require('../../utils/company');
const { drfPaginate, drfResponse } = require('../../utils/pagination');
const { vendorToJSON, getUserMap } = require('../../utils/formatters');
const { relPath } = require('../../middleware/upload');

function parseBody(req) {
  const b = req.body || {};
  return {
    name: b.name,
    number: b.number,
    companyName: b.company_name || b.companyName,
    email: b.email,
    companyWebsite: b.company_website,
    companyPanOrRegNo: b.company_pan_or_reg_no,
    poc1Name: b.poc1_name,
    poc1Number: b.poc1_number,
    poc2Name: b.poc2_name,
    poc2Number: b.poc2_number,
    top3Clients: b.top_3_clients,
    noOfBenchDevelopers: b.no_of_bench_developers ? parseInt(b.no_of_bench_developers, 10) : undefined,
    provideOnsite: b.provide_onsite === 'true' || b.provide_onsite === true,
    onsiteLocation: b.onsite_location,
    specializedTechDevelopers: b.specialized_tech_developers,
    vendorOfficialEmail: b.vendor_official_email,
    sendingEmailId: b.sending_email_id,
    provideBench: b.provide_bench === 'true' || b.provide_bench === true,
    provideMarket: b.provide_market === 'true' || b.provide_market === true,
    companyEmployeeCount: b.company_employee_count ? parseInt(b.company_employee_count, 10) : undefined,
    remark: b.remark,
    ndaStatus: b.nda_status,
    msaStatus: b.msa_status,
  };
}

async function create(req, res) {
  const data = parseBody(req);
  if (!data.name || !data.companyName || !data.number) {
    return res.status(400).json({ name: ['Vendor name is required.'] });
  }
  const files = req.files || {};
  const doc = await Vendor.create({
    ...data,
    uploadedById: req.user.id,
    createdById: req.user.id,
    benchList: files.bench_list?.[0] ? relPath(files.bench_list[0].path) : undefined,
    ndaDocument: files.nda_document?.[0] ? relPath(files.nda_document[0].path) : undefined,
    msaDocument: files.msa_document?.[0] ? relPath(files.msa_document[0].path) : undefined,
  });
  const json = await vendorToJSON(doc);
  return res.status(201).json({
    message: 'Vendor created successfully',
    vendor_id: doc.id,
    ...json,
  });
}

async function update(req, res) {
  const vendor = await Vendor.findOne({ id: parseInt(req.params.vendor_id, 10), isDeleted: false });
  if (!vendor) return res.status(404).json({ detail: 'Not found.' });
  Object.assign(vendor, parseBody(req));
  const files = req.files || {};
  if (files.bench_list?.[0]) vendor.benchList = relPath(files.bench_list[0].path);
  if (files.nda_document?.[0]) vendor.ndaDocument = relPath(files.nda_document[0].path);
  if (files.msa_document?.[0]) vendor.msaDocument = relPath(files.msa_document[0].path);
  await vendor.save();
  return res.json(await vendorToJSON(vendor));
}

async function detail(req, res) {
  const vendor = await Vendor.findOne({ id: parseInt(req.params.vendor_id, 10), isDeleted: false });
  if (!vendor) return res.status(404).json({ detail: 'Not found.' });
  const count = await Candidate.countDocuments({ vendorId: vendor.id, isDeleted: false });
  const json = await vendorToJSON(vendor);
  return res.json({ ...json, profile_count: count });
}

async function softDelete(req, res) {
  const vendor = await Vendor.findOne({ id: parseInt(req.params.vendor_id, 10) });
  if (!vendor) return res.status(404).json({ detail: 'Not found.' });

  const User = require('../../models/User');
  let allowedIds = [req.user.id];
  
  if (req.user.isTeamLeader && req.headers['x-team-leader-mode'] === 'true') {
    const teamMembers = await User.find({ teamLeaderId: req.user.id }).select('id');
    allowedIds = allowedIds.concat(teamMembers.map(u => u.id));
  }

  if (!allowedIds.includes(vendor.createdById)) {
    return res.status(403).json({ error: 'You can only delete vendors created by yourself or your team members.' });
  }

  vendor.isDeleted = true;
  await vendor.save();
  return res.json({ message: 'Vendor deleted successfully' });
}

async function toggleVerify(req, res) {
  if (req.user.role !== 'SUB_ADMIN') return res.status(403).json({ detail: 'Forbidden' });
  const vendor = await Vendor.findOne({ id: parseInt(req.params.vendor_id, 10), isDeleted: false });
  if (!vendor) return res.status(404).json({ detail: 'Not found.' });
  vendor.isVerified = !vendor.isVerified;
  await vendor.save();
  return res.json({ message: 'Verification updated', data: { is_verified: vendor.isVerified } });
}

async function listUserVendors(req, res) {
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const search = (req.query.search || '').trim();
  let targetIds = [req.user.id];
  if (req.user.isTeamLeader && req.headers['x-team-leader-mode'] === 'true') {
    const User = require('../../models/User');
    const teamMembers = await User.find({ teamLeaderId: req.user.id }).select('id');
    targetIds = targetIds.concat(teamMembers.map(u => u.id));
  }

  const filter = {
    isDeleted: false,
    $or: [
      { createdById: { $in: targetIds } },
      ...targetIds.map(id => ({ assignedEmployeeIds: id }))
    ],
  };
  if (search) {
    filter.$and = [
      {
        $or: [
          { name: new RegExp(search, 'i') },
          { companyName: new RegExp(search, 'i') },
        ],
      },
    ];
  }
  const [items, total] = await Promise.all([
    Vendor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Vendor.countDocuments(filter),
  ]);
  const userMap = await getUserMap(items.flatMap((v) => [v.uploadedById, v.createdById]));
  return res.json(drfResponse(items.map((v) => vendorToJSON(v, userMap)), total, page, pageSize));
}

async function listCompanyPool(req, res) {
  const companyIds = await getCompanyUserIds(req.user, req);
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const search = (req.query.search || '').trim();
  const filter = { isDeleted: false, createdById: { $in: companyIds } };
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { companyName: new RegExp(search, 'i') },
    ];
  }
  const [items, total] = await Promise.all([
    Vendor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Vendor.countDocuments(filter),
  ]);
  const userMap = await getUserMap(items.flatMap((v) => [v.uploadedById, v.createdById]));
  return res.json(drfResponse(items.map((v) => vendorToJSON(v, userMap)), total, page, pageSize));
}
async function checkDuplicate(req, res) {
  const { vendor_name, company_name, phone_number } = req.body;
  
  if (!vendor_name && !company_name && !phone_number) {
    return res.json({ duplicate: false });
  }

  const { Op } = require('sequelize');

  const orConditions = [];
  if (vendor_name && vendor_name.trim() !== '') {
    orConditions.push({ name: { [Op.iLike]: `%${vendor_name.trim()}%` } });
  }
  if (company_name && company_name.trim() !== '') {
    orConditions.push({ companyName: { [Op.iLike]: `%${company_name.trim()}%` } });
  }
  if (phone_number && phone_number.trim() !== '') {
    orConditions.push({ number: phone_number.trim() });
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
    const existingVendor = await Vendor.findOne(filterOrOptions);
    if (existingVendor) {
      const userMap = await getUserMap([existingVendor.createdById]);
      return res.json({ 
        duplicate: true, 
        vendor: await vendorToJSON(existingVendor, userMap) 
      });
    }
    return res.json({ duplicate: false });
  } catch (error) {
    console.error("Duplicate check error:", error);
    return res.json({ duplicate: false });
  }
}

module.exports = { create, update, detail, softDelete, toggleVerify, listUserVendors, listCompanyPool, checkDuplicate };
