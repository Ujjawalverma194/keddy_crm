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

// A profile should be considered "submitted" only after the explicit
// Submission Modal flow marks it verified. Newly sourced/created profiles may
// still have mainStatus=SUBMITTED/submittedToId because of legacy Django parity,
// so submitted sections must not rely on mainStatus alone.
function submittedProfileBaseFilter(extra = {}) {
  return {
    isDeleted: false,
    verificationStatus: true,
    clientId: { $ne: null },
    ...extra,
  };
}

async function companyFilter(user) {
  const ids = await getCompanyUserIds(user);
  return { $in: ids };
}

async function dashboardStats(req, res) {
  try {
    const ids = await getCompanyUserIds(req.user, req);
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
      Candidate.countDocuments(submittedProfileBaseFilter({ createdById: { $in: ids } })),
      Candidate.countDocuments({ ...base, mainStatus: 'ONBORD' }),
      Vendor.countDocuments({ isDeleted: false, createdById: { $in: ids } }),
      Client.countDocuments({ isDeleted: false, createdById: { $in: ids } }),
      Candidate.countDocuments(base),
      User.countDocuments(
        (req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader)
          ? { teamLeaderId: req.user.id, isDeleted: false, role: { $in: ['EMPLOYEE', 'ACCOUNTANT'] } }
          : { parentUserId: companyId, isDeleted: false, role: { $in: ['EMPLOYEE', 'ACCOUNTANT'] } }
      ),
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
    const ids = await getCompanyUserIds(req.user, req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const items = await Candidate.find({
      createdById: { $in: ids },
      isDeleted: false,
      verificationStatus: true,
      clientId: { $ne: null },
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
    const ids = await getCompanyUserIds(req.user, req);
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
    const ids = await getCompanyUserIds(req.user, req);
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
  const ids = await getCompanyUserIds(req.user, req);
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
  const filter = {};
  if (req.headers['x-team-leader-mode'] === 'true') {
    filter.isDeleted = false;
    filter.role = 'EMPLOYEE';
    filter.teamLeaderId = req.user.id;
    filter.id = { $ne: req.user.id };
  } else {
    if (req.user.role === 'CENTRAL_ADMIN') {
      // CENTRAL_ADMIN sees everything, no filters
    } else {
      filter.isDeleted = false;
      filter.role = { $in: ['EMPLOYEE', 'ACCOUNTANT'] };
      filter.parentUserId = companyId;
    }
  }
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
    is_active: u.isActive,
    is_deleted: u.isDeleted,
    profile_picture: u.profilePicture,
    full_name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
    isTeamLeader: u.isTeamLeader,
    teamLeaderId: u.teamLeaderId,
  }));
  return res.json(results);
}

  async function createUser(req, res) {
    const { first_name, last_name, email, number, password, role } = req.body;

    const isTeamLeader = req.body.isTeamLeader === 'true' || req.body.isTeamLeader === true;
    const teamLeaderId = (req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader) ? req.user.id : (req.body.teamLeaderId || null);

    if (role === 'ACCOUNTANT' && (isTeamLeader || teamLeaderId)) {
      return res.status(400).json({ success: false, message: 'Accountants cannot be Team Leaders or assigned to a team.' });
    }

    if (isTeamLeader && teamLeaderId) {
      return res.status(400).json({ success: false, message: 'Cannot assign a Team Leader role to an employee who is already assigned to a team. Please unassign them first.' });
    }

    const hashed = await User.hashPassword(password || 'changeme123');
    const user = await User.create({
      firstName: first_name,
      lastName: last_name,
      email: email?.toLowerCase(),
      number,
      password: hashed,
      role: role || 'EMPLOYEE',
      parentUserId: (req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader) ? (resolveCompanyId(req.user) || req.user.id) : req.user.id,
      teamLeaderId,
      isTeamLeader,
      profilePicture: req.file ? relPath(req.file.path) : null,
    });
  return res.status(201).json({ success: true, data: { id: user.id } });
}

async function getUser(req, res) {
  const user = await User.findOne({
    id: parseInt(req.params.pk || req.params.user_id, 10),
    ...(req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader ? { teamLeaderId: req.user.id } : { parentUserId: req.user.id }),
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
      isTeamLeader: user.isTeamLeader,
      teamLeaderId: user.teamLeaderId,
    },
  });
}

async function updateUser(req, res) {
  const user = await User.findOne({
    id: parseInt(req.params.pk, 10),
    ...(req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader ? { teamLeaderId: req.user.id } : { parentUserId: req.user.id }),
  });
  if (!user) return res.status(404).json({ detail: 'Not found' });
  const { first_name, last_name, email, number, role, password, isTeamLeader, teamLeaderId } = req.body;
  if (first_name) user.firstName = first_name;
  if (last_name) user.lastName = last_name;
  if (email) user.email = email.toLowerCase();
  if (number) user.number = number;
  if (role) user.role = role;
  if (password) user.password = await User.hashPassword(password);
    const isTeamLeaderMode = req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader;

    if (!isTeamLeaderMode) {
      if (isTeamLeader !== undefined) {
        const newIsTeamLeader = isTeamLeader === 'true' || isTeamLeader === true;
        const willHaveTeamLeader = teamLeaderId !== undefined ? (teamLeaderId !== null && teamLeaderId !== "") : user.teamLeaderId !== null;

        if (newIsTeamLeader && willHaveTeamLeader) {
           return res.status(400).json({ success: false, message: 'Cannot assign a Team Leader role to an employee who is already assigned to a team. Please unassign them first.' });
        }

        if (user.isTeamLeader && !newIsTeamLeader) {
          await User.update({ teamLeaderId: null }, { where: { teamLeaderId: user.id } });
        }
        user.isTeamLeader = newIsTeamLeader;
      }
      if (teamLeaderId !== undefined) user.teamLeaderId = teamLeaderId || null;
    }

    const updatedRole = role || user.role;
    if (updatedRole === 'ACCOUNTANT' && (user.isTeamLeader || user.teamLeaderId)) {
       return res.status(400).json({ success: false, message: 'Accountants cannot be Team Leaders or assigned to a team.' });
    }

  await user.save();
  return res.json({ success: true, message: 'User updated' });
}

async function softDeleteUser(req, res) {
  await User.updateOne(
    { 
      id: parseInt(req.params.user_id, 10), 
      ...(req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader ? { teamLeaderId: req.user.id } : { parentUserId: req.user.id }) 
    },
    { isDeleted: true }
  );
  return res.json({ message: 'User soft deleted' });
}

async function hardDeleteUser(req, res) {
  await User.deleteOne({ 
    id: parseInt(req.params.user_id, 10), 
    ...(req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader ? { teamLeaderId: req.user.id } : { parentUserId: req.user.id }) 
  });
  return res.json({ message: 'User hard deleted' });
}

async function restoreUser(req, res) {
  await User.updateOne(
    { 
      id: parseInt(req.params.user_id, 10), 
      ...(req.headers['x-team-leader-mode'] === 'true' && req.user.isTeamLeader ? { teamLeaderId: req.user.id } : { parentUserId: req.user.id }) 
    },
    { isDeleted: false }
  );
  return res.json({ message: 'User restored' });
}

async function listClients(req, res) {
  const ids = await getCompanyUserIds(req.user, req);
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
  const ids = await getCompanyUserIds(req.user, req);
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const filter = { isDeleted: false, createdById: { $in: ids } };
  
  const { VendorPOC } = require('../models/sequelize/init');
  const { toSequelizeWhere } = require('../utils/sequelizeWhere');

  const [items, total] = await Promise.all([
    Vendor.rawModel.findAll({
      where: toSequelizeWhere(filter, Vendor.rawModel),
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: limit,
      include: [{ model: VendorPOC, as: 'pocs' }]
    }),
    Vendor.countDocuments(filter),
  ]);
  const userMap = await getUserMap(items.flatMap((v) => [v.createdById, v.uploadedById]));
  return res.json(drfResponse(items.map((v) => vendorToJSON(v, userMap)), total, page, pageSize));
}

async function searchVendors(req, res) {
  const { q } = req.query;
  const ids = await getCompanyUserIds(req.user, req);
  const filter = { isDeleted: false, createdById: { $in: ids } };
  if (q) {
    filter.companyName = { $iLike: `%${q}%` };
  }
  const items = await Vendor.find(filter).limit(10);
  return res.json(items.map((v) => ({ 
    id: v.id, 
    companyName: v.companyName, 
    email: v.vendorOfficialEmail || v.email, 
    companyWebsite: v.companyWebsite, 
    companyPanOrRegNo: v.companyPanOrRegNo,
    sendingEmailId: v.sendingEmailId,
    companyEmployeeCount: v.companyEmployeeCount,
    top3Clients: v.top3Clients,
    noOfBenchDevelopers: v.noOfBenchDevelopers,
    specializedTechDevelopers: v.specializedTechDevelopers
  })));
}

async function assignVendor(req, res) {
  const { vendor_id, poc_id, employee_ids } = req.body;
  if (poc_id) {
    const { VendorPOC } = require('../models/sequelize/init');
    const poc = await VendorPOC.findOne({ where: { id: poc_id } });
    if (!poc) return res.status(404).json({ detail: 'POC not found' });
    poc.assignedEmployeeIds = [...new Set([...(poc.assignedEmployeeIds || []), ...employee_ids])];
    poc.changed('assignedEmployeeIds', true);
    await poc.save();
    return res.json({ message: 'Assigned to POC' });
  }

  const vendor = await Vendor.findOne({ id: vendor_id });
  if (!vendor) return res.status(404).json({ detail: 'Not found' });
  vendor.assignedEmployeeIds = [...new Set([...(vendor.assignedEmployeeIds || []), ...employee_ids])];
  vendor.changed('assignedEmployeeIds', true);
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
  const ids = await getCompanyUserIds(req.user, req);
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
    const ids = await getCompanyUserIds(req.user, req);
    const { page, pageSize, skip, limit } = drfPaginate(req.query);

    const baseFilter =
      status === 'SUBMITTED'
        ? submittedProfileBaseFilter({ createdById: { $in: ids } })
        : { isDeleted: false, createdById: { $in: ids }, mainStatus: status };

    const filter = applyCandidateListFilters(baseFilter, req.query);
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

async function teamOverviewAnalytics(req, res) {
  try {
    const timeFilter = req.query.time || 'today';
    const employeeId = req.query.employee_id;
    
    let teamIds = await getCompanyUserIds(req.user, req);
    let targetIds = [...teamIds];
    if (employeeId && employeeId !== 'all') {
      targetIds = [parseInt(employeeId, 10)];
    }

    let startDate = new Date();
    let endDate = new Date();
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

    if (timeFilter === 'week') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(startDate.setDate(diff));
      startDate.setHours(0,0,0,0);
    } else if (timeFilter === 'month') {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    } else if (timeFilter === 'quarter') {
      const quarter = Math.floor(startDate.getMonth() / 3);
      startDate = new Date(startDate.getFullYear(), quarter * 3, 1);
    } else if (timeFilter === 'custom') {
      if (req.query.start) startDate = new Date(req.query.start);
      if (req.query.end) {
        endDate = new Date(req.query.end);
        endDate.setHours(23,59,59,999);
      }
    }

    let prevStartDate = new Date(startDate);
    let prevEndDate = new Date(endDate);
    if (timeFilter === 'today') {
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate = new Date(prevStartDate);
      prevEndDate.setHours(23, 59, 59, 999);
    } else if (timeFilter === 'week') {
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate = new Date(startDate);
      prevEndDate.setMilliseconds(-1);
    } else if (timeFilter === 'month') {
      prevStartDate.setMonth(prevStartDate.getMonth() - 1);
      prevEndDate = new Date(startDate);
      prevEndDate.setMilliseconds(-1);
    } else if (timeFilter === 'quarter') {
      prevStartDate.setMonth(prevStartDate.getMonth() - 3);
      prevEndDate = new Date(startDate);
      prevEndDate.setMilliseconds(-1);
    } else if (timeFilter === 'custom') {
      const diffTime = endDate.getTime() - startDate.getTime();
      prevEndDate = new Date(startDate);
      prevEndDate.setMilliseconds(-1);
      prevStartDate = new Date(prevEndDate.getTime() - diffTime);
    }

    const dateQuery = { $gte: startDate, $lte: endDate };
    const prevDateQuery = { $gte: prevStartDate, $lte: prevEndDate };

    const [allProfiles, allSubmittedProfiles, prevAllProfiles, prevAllSubmittedProfiles] = await Promise.all([
      Candidate.find({ isDeleted: false, createdById: { $in: teamIds }, createdAt: dateQuery }),
      Candidate.find({ ...submittedProfileBaseFilter({ createdById: { $in: teamIds } }), createdAt: dateQuery }),
      Candidate.find({ isDeleted: false, createdById: { $in: teamIds }, createdAt: prevDateQuery }),
      Candidate.find({ ...submittedProfileBaseFilter({ createdById: { $in: teamIds } }), createdAt: prevDateQuery })
    ]);

    const profiles = allProfiles.filter(p => targetIds.includes(Number(p.createdById)));
    const submittedProfiles = allSubmittedProfiles.filter(p => targetIds.includes(Number(p.createdById)));

    const prevProfiles = prevAllProfiles.filter(p => targetIds.includes(Number(p.createdById)));
    const prevSubmittedProfiles = prevAllSubmittedProfiles.filter(p => targetIds.includes(Number(p.createdById)));

    const totalSourced = profiles.length;
    const exactSubmitted = submittedProfiles.length;
    const exactOnboarded = profiles.filter(p => p.mainStatus === 'ONBORD').length;

    const l1Count = profiles.filter(p => p.mainStatus === 'L1').length;
    const l2Count = profiles.filter(p => p.mainStatus === 'L2').length;
    const l3Count = profiles.filter(p => p.mainStatus === 'L3').length;
    const screeningCount = profiles.filter(p => p.mainStatus === 'SCREENING').length;
    const interviewCount = l1Count + l2Count + l3Count;
    
    const prevTotalSourced = prevProfiles.length;
    const prevExactSubmitted = prevSubmittedProfiles.length;
    const prevExactOnboarded = prevProfiles.filter(p => p.mainStatus === 'ONBORD').length;
    const prevL1Count = prevProfiles.filter(p => p.mainStatus === 'L1').length;
    const prevL2Count = prevProfiles.filter(p => p.mainStatus === 'L2').length;
    const prevL3Count = prevProfiles.filter(p => p.mainStatus === 'L3').length;
    const prevInterviewCount = prevL1Count + prevL2Count + prevL3Count;

    const calcChange = (curr, prev) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
    };

    const uniqueRecruiters = new Set(profiles.map(p => p.createdById)).size || 1;
    const avgSubmitsRecruiter = (exactSubmitted / uniqueRecruiters).toFixed(1);

    const days = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const weeks = Math.max(1, days / 7);
    const avgSubmitsWeek = (exactSubmitted / weeks).toFixed(1);

    const formatDateLocal = (dateStr) => {
       const d = new Date(dateStr);
       return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const activityMap = {};
    
    submittedProfiles.forEach(p => {
       const d = formatDateLocal(p.createdAt);
       if(!activityMap[d]) activityMap[d] = { submitted: 0, interviews: 0, onboarded: 0 };
       activityMap[d].submitted++;
    });

    profiles.forEach(p => {
       const d = formatDateLocal(p.createdAt);
       if(!activityMap[d]) activityMap[d] = { submitted: 0, interviews: 0, onboarded: 0 };
       if (['L1','L2','L3'].includes(p.mainStatus)) activityMap[d].interviews++;
       if (p.mainStatus === 'ONBORD') activityMap[d].onboarded++;
    });

    const activity_over_time = [];
    for(let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dStr = formatDateLocal(d);
        activity_over_time.push({
            date: dStr,
            submitted: activityMap[dStr]?.submitted || 0,
            interviews: activityMap[dStr]?.interviews || 0,
            onboarded: activityMap[dStr]?.onboarded || 0,
        });
    }

    const teamUsers = await User.find({ id: { $in: teamIds }, role: { $ne: 'ACCOUNTANT' } });
    const team_breakdown = teamUsers.map(u => {
       const uProfiles = allProfiles.filter(p => Number(p.createdById) === Number(u.id));
       const uSubmitted = allSubmittedProfiles.filter(p => Number(p.createdById) === Number(u.id));
       
       let uL1 = 0, uL2 = 0, uL3 = 0, uOnb = 0, uScreen = 0;
       uProfiles.forEach(p => {
           if (p.mainStatus === 'L1') uL1++;
           if (p.mainStatus === 'L2') uL2++;
           if (p.mainStatus === 'L3') uL3++;
           if (p.mainStatus === 'ONBORD') uOnb++;
           if (p.mainStatus === 'SCREENING') uScreen++;
       });

       const todayStart = new Date(); todayStart.setHours(0,0,0,0);
       const uTodayProfiles = uProfiles.filter(p => new Date(p.createdAt) >= todayStart);
       const uTodaySub = uSubmitted.filter(p => new Date(p.createdAt) >= todayStart);

       return {
           id: u.id,
           first_name: u.firstName,
           last_name: u.lastName,
           role: u.role,
           isTeamLeader: u.isTeamLeader,
           today_src: uTodayProfiles.length,
           today_sub: uTodaySub.length,
           sourced: uProfiles.length,
           screen: uScreen,
           submitted: uSubmitted.length,
           l1: uL1,
           l2: uL2,
           l3: uL3,
           onboarded: uOnb
       };
    });

    return res.json({
        summary_metrics: {
            profiles_sourced: totalSourced,
            profiles_sourced_change: calcChange(totalSourced, prevTotalSourced),
            submitted: exactSubmitted,
            submitted_change: calcChange(exactSubmitted, prevExactSubmitted),
            total_interviews: interviewCount,
            total_interviews_change: calcChange(interviewCount, prevInterviewCount),
            onboarded: exactOnboarded,
            onboarded_change: calcChange(exactOnboarded, prevExactOnboarded),
            avg_submits_recruiter: avgSubmitsRecruiter,
            avg_submits_week: avgSubmitsWeek
        },
        pipeline_funnel: {
            sourced: totalSourced,
            internal_screening: screeningCount,
            submitted: exactSubmitted,
            l1: l1Count,
            l2: l2Count,
            l3: l3Count,
            onboarded: exactOnboarded
        },
        activity_over_time,
        team_breakdown
    });
  } catch (err) {
    console.error('teamOverviewAnalytics error:', err);
    return res.status(500).json({ detail: 'Failed to load team analytics' });
  }
}

module.exports = {
  teamOverviewAnalytics,
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
  searchVendors,
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
