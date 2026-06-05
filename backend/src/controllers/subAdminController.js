const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Client = require('../models/Client');
const Candidate = require('../models/Candidate');
const { Requirement } = require('../models/Requirement');
const { getCompanyUserIds, resolveCompanyId } = require('../utils/company');
const { drfPaginate, drfResponse } = require('../utils/pagination');
const {
  vendorToJSON,
  clientToJSON,
  candidateToJSON,
  candidatesToJSON,
  getUserMap,
} = require('../utils/formatters');
const { relPath } = require('../middleware/upload');

const PIPELINE = ['SCREENING', 'L1', 'L2', 'L3', 'OTHER'];

async function companyFilter(user) {
  const ids = await getCompanyUserIds(user);
  return { $in: ids };
}

async function dashboardStats(req, res) {
  try {
    const ids = await getCompanyUserIds(req.user);
    const companyId = resolveCompanyId(req.user) || req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayRange = { $gte: today, $lt: tomorrow };

    const base = { isDeleted: false, createdById: { $in: ids } };
    const teamOr = { $or: [{ createdById: { $in: ids } }, { submittedToId: { $in: ids } }] };

    const [
      teamPipeline,
      todayProfiles,
      todaySubmitted,
      totalSubmitted,
      onboardProfiles,
      totalVendors,
      totalClients,
      totalProfiles,
      totalEmployees,
      todayRequirements,
    ] = await Promise.all([
      Candidate.countDocuments({
        ...base,
        verificationStatus: true,
        mainStatus: { $in: PIPELINE },
      }),
      Candidate.countDocuments({ ...base, createdAt: todayRange }),
      Candidate.countDocuments({
        isDeleted: false,
        verificationStatus: true,
        clientId: { $ne: null },
        createdAt: todayRange,
        ...teamOr,
      }),
      Candidate.countDocuments({ ...base, mainStatus: 'SUBMITTED' }),
      Candidate.countDocuments({ ...base, mainStatus: 'ONBORD' }),
      Vendor.countDocuments({ isDeleted: false, createdById: { $in: ids } }),
      Client.countDocuments({ isDeleted: false, createdById: { $in: ids } }),
      Candidate.countDocuments(base),
      User.countDocuments({
        parentUserId: companyId,
        isDeleted: false,
        role: { $in: ['EMPLOYEE', 'ACCOUNTANT'] },
      }),
      Requirement.countDocuments({
        companyId,
        isDeleted: false,
        createdAt: todayRange,
      }),
    ]);

    return res.json({
      user_name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      team_pipeline: teamPipeline,
      today_profiles: todayProfiles,
      today_submitted_profiles: todaySubmitted,
      total_submitted_profiles: totalSubmitted,
      onboard_profiles: onboardProfiles,
      total_vendors: totalVendors,
      total_clients: totalClients,
      total_profiles: totalProfiles,
      total_employees: totalEmployees,
      today_requirements: todayRequirements,
    });
  } catch (err) {
    console.error('dashboardStats error:', err);
    return res.status(500).json({ detail: 'Failed to load dashboard stats' });
  }
}

async function todayVerified(req, res) {
  try {
    const ids = await getCompanyUserIds(req.user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const items = await Candidate.find({
      createdById: { $in: ids },
      isDeleted: false,
      verificationStatus: true,
      createdAt: { $gte: today, $lt: tomorrow },
    });
    return res.json(await candidatesToJSON(items));
  } catch (err) {
    console.error('todayVerified error:', err);
    return res.status(500).json([]);
  }
}

async function pipeline(req, res) {
  try {
    const ids = await getCompanyUserIds(req.user);
    const search = (req.query.search || '').trim();
    const filter = {
      createdById: { $in: ids },
      isDeleted: false,
      verificationStatus: true,
      mainStatus: { $in: PIPELINE },
    };
    if (search) filter.candidateName = new RegExp(search, 'i');
    const items = await Candidate.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.json(await candidatesToJSON(items));
  } catch (err) {
    console.error('pipeline error:', err);
    return res.status(500).json([]);
  }
}

async function todayProfiles(req, res) {
  try {
    const ids = await getCompanyUserIds(req.user);
    const { page, pageSize, skip, limit } = drfPaginate(req.query);
    const search = (req.query.search || '').trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter = {
      isDeleted: false,
      createdById: { $in: ids },
      createdAt: { $gte: today, $lt: tomorrow },
    };
    if (search) {
      filter.$or = [
        { candidateName: new RegExp(search, 'i') },
        { candidateEmail: new RegExp(search, 'i') },
        { technology: new RegExp(search, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Candidate.countDocuments(filter),
    ]);
    const results = await candidatesToJSON(items);
    return res.json(drfResponse(results, total, page, pageSize));
  } catch (err) {
    console.error('todayProfiles error:', err);
    return res.json(drfResponse([], 0, 1, 20));
  }
}

async function last7Verified(req, res) {
  const ids = await getCompanyUserIds(req.user);
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const items = await Candidate.find({
    createdById: { $in: ids },
    isDeleted: false,
    verificationStatus: true,
    createdAt: { $gte: since },
  });
  return res.json(await candidatesToJSON(items));
}

async function listUsers(req, res) {
  const companyId = resolveCompanyId(req.user);
  const search = (req.query.search || '').trim();
  const filter = {
    parentUserId: companyId,
    isDeleted: false,
    role: { $in: ['EMPLOYEE', 'ACCOUNTANT'] },
  };
  if (search) {
    const or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { number: new RegExp(search, 'i') },
    ];
    const idNum = parseInt(search, 10);
    if (!Number.isNaN(idNum) && String(idNum) === search) or.push({ id: idNum });
    filter.$and = [{ $or: or }];
  }
  const users = await User.find(filter);
  const results = users.map((u) => ({
    id: u.id,
    first_name: u.firstName,
    last_name: u.lastName,
    email: u.email,
    number: u.number,
    role: u.role,
    profile_picture: u.profilePicture,
    full_name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
  }));
  return res.json(results);
}

async function createUser(req, res) {
  const { first_name, last_name, email, number, password, role } = req.body;
  const hashed = await User.hashPassword(password || 'changeme123');
  const user = await User.create({
    firstName: first_name,
    lastName: last_name,
    email: email?.toLowerCase(),
    number,
    password: hashed,
    role: role || 'EMPLOYEE',
    parentUserId: req.user.id,
    profilePicture: req.file ? relPath(req.file.path) : null,
  });
  return res.status(201).json({ success: true, data: { id: user.id } });
}

async function getUser(req, res) {
  const user = await User.findOne({
    id: parseInt(req.params.pk || req.params.user_id, 10),
    parentUserId: req.user.id,
  });
  if (!user) return res.status(404).json({ success: false });
  return res.json({
    success: true,
    data: {
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      number: user.number,
      role: user.role,
    },
  });
}

async function updateUser(req, res) {
  const user = await User.findOne({
    id: parseInt(req.params.pk, 10),
    parentUserId: req.user.id,
  });
  if (!user) return res.status(404).json({ detail: 'Not found' });
  const { first_name, last_name, email, number, role, password } = req.body;
  if (first_name) user.firstName = first_name;
  if (last_name) user.lastName = last_name;
  if (email) user.email = email.toLowerCase();
  if (number) user.number = number;
  if (role) user.role = role;
  if (password) user.password = await User.hashPassword(password);
  await user.save();
  return res.json({ success: true, message: 'User updated' });
}

async function softDeleteUser(req, res) {
  await User.updateOne(
    { id: parseInt(req.params.user_id, 10), parentUserId: req.user.id },
    { isDeleted: true }
  );
  return res.json({ message: 'User soft deleted' });
}

async function hardDeleteUser(req, res) {
  await User.deleteOne({ id: parseInt(req.params.user_id, 10), parentUserId: req.user.id });
  return res.status(204).send();
}

async function restoreUser(req, res) {
  await User.updateOne(
    { id: parseInt(req.params.user_id, 10), parentUserId: req.user.id },
    { isDeleted: false }
  );
  return res.json({ message: 'User restored' });
}

async function listClients(req, res) {
  const ids = await getCompanyUserIds(req.user);
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const filter = { isDeleted: false, createdById: { $in: ids } };
  const [items, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Client.countDocuments(filter),
  ]);
  const userMap = await getUserMap(items.map((c) => c.createdById));
  return res.json(drfResponse(items.map((c) => clientToJSON(c, userMap)), total, page, pageSize));
}

async function assignClient(req, res) {
  const { client_id, employee_ids } = req.body;
  const client = await Client.findOne({ id: client_id, isDeleted: false });
  if (!client) return res.status(404).json({ detail: 'Not found' });
  client.assignedEmployeeIds = [...new Set([...(client.assignedEmployeeIds || []), ...employee_ids])];
  await client.save();
  return res.json({ message: 'Assigned successfully' });
}

async function revokeClient(req, res) {
  const { client_id, employee_ids } = req.body;
  const client = await Client.findOne({ id: client_id });
  if (!client) return res.status(404).json({ detail: 'Not found' });
  client.assignedEmployeeIds = (client.assignedEmployeeIds || []).filter(
    (id) => !employee_ids.includes(id)
  );
  await client.save();
  return res.json({ message: 'Revoked successfully' });
}

async function clientSoftDelete(req, res) {
  await Client.updateOne({ id: parseInt(req.params.client_id, 10) }, { isDeleted: true });
  return res.json({ message: 'Deleted' });
}

async function clientRestore(req, res) {
  await Client.updateOne({ id: parseInt(req.params.client_id, 10) }, { isDeleted: false });
  return res.json({ message: 'Restored' });
}

async function clientHardDelete(req, res) {
  await Client.deleteOne({ id: parseInt(req.params.client_id, 10) });
  return res.status(204).send();
}

async function listVendors(req, res) {
  const ids = await getCompanyUserIds(req.user);
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const filter = { isDeleted: false, createdById: { $in: ids } };
  const [items, total] = await Promise.all([
    Vendor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Vendor.countDocuments(filter),
  ]);
  const userMap = await getUserMap(items.flatMap((v) => [v.createdById, v.uploadedById]));
  return res.json(drfResponse(items.map((v) => vendorToJSON(v, userMap)), total, page, pageSize));
}

async function assignVendor(req, res) {
  const { vendor_id, employee_ids } = req.body;
  const vendor = await Vendor.findOne({ id: vendor_id });
  if (!vendor) return res.status(404).json({ detail: 'Not found' });
  vendor.assignedEmployeeIds = [...new Set([...(vendor.assignedEmployeeIds || []), ...employee_ids])];
  await vendor.save();
  return res.json({ message: 'Assigned' });
}

async function vendorSoftDelete(req, res) {
  await Vendor.updateOne({ id: parseInt(req.params.vendor_id, 10) }, { isDeleted: true });
  return res.json({ message: 'Deleted' });
}

async function vendorRestore(req, res) {
  await Vendor.updateOne({ id: parseInt(req.params.vendor_id, 10) }, { isDeleted: false });
  return res.json({ message: 'Restored' });
}

async function vendorHardDelete(req, res) {
  await Vendor.deleteOne({ id: parseInt(req.params.vendor_id, 10) });
  return res.status(204).send();
}

function applyCandidateListFilters(filter, query) {
  const search = (query.search || '').trim();
  const tech = (query.technology || '').trim();
  if (search) {
    filter.$or = [
      { candidateName: new RegExp(search, 'i') },
      { candidateEmail: new RegExp(search, 'i') },
      { technology: new RegExp(search, 'i') },
    ];
  }
  if (tech) filter.technology = new RegExp(tech, 'i');
  return filter;
}

async function listCandidates(req, res) {
  const ids = await getCompanyUserIds(req.user);
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const filter = applyCandidateListFilters(
    { isDeleted: false, createdById: { $in: ids } },
    req.query
  );
  const [items, total] = await Promise.all([
    Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Candidate.countDocuments(filter),
  ]);
  const results = await candidatesToJSON(items);
  return res.json(drfResponse(results, total, page, pageSize));
}

function filterByStatus(status) {
  return async (req, res) => {
    const ids = await getCompanyUserIds(req.user);
    const { page, pageSize, skip, limit } = drfPaginate(req.query);
    const filter = applyCandidateListFilters(
      { isDeleted: false, createdById: { $in: ids }, mainStatus: status },
      req.query
    );
    const [items, total] = await Promise.all([
      Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Candidate.countDocuments(filter),
    ]);
    const results = await candidatesToJSON(items);
    return res.json(drfResponse(results, total, page, pageSize));
  };
}

async function candidateSoftDelete(req, res) {
  await Candidate.updateOne({ id: parseInt(req.params.pk, 10) }, { isDeleted: true });
  return res.json({ message: 'Deleted' });
}

async function candidateRestore(req, res) {
  await Candidate.updateOne({ id: parseInt(req.params.pk, 10) }, { isDeleted: false });
  return res.json({ message: 'Restored' });
}

async function candidateHardDelete(req, res) {
  await Candidate.deleteOne({ id: parseInt(req.params.pk, 10) });
  return res.status(204).send();
}

async function removeFromOffboarded(req, res) {
  await Candidate.updateOne(
    { id: parseInt(req.params.candidate_id, 10) },
    { mainStatus: 'ONBORD' }
  );
  return res.json({ message: 'Updated' });
}

module.exports = {
  dashboardStats,
  todayVerified,
  pipeline,
  todayProfiles,
  last7Verified,
  listUsers,
  createUser,
  getUser,
  updateUser,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
  listClients,
  assignClient,
  revokeClient,
  clientSoftDelete,
  clientRestore,
  clientHardDelete,
  listVendors,
  assignVendor,
  vendorSoftDelete,
  vendorRestore,
  vendorHardDelete,
  listCandidates,
  submitted: filterByStatus('SUBMITTED'),
  onboard: filterByStatus('ONBORD'),
  offboarded: filterByStatus('OFFBOARDED'),
  candidateSoftDelete,
  candidateRestore,
  candidateHardDelete,
  removeFromOffboarded,
};
