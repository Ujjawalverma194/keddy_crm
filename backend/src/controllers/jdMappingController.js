const Client = require('../models/Client');
const User = require('../models/User');
const { Requirement, generateRequirementId } = require('../models/Requirement');
const { RequirementAssignment, CandidateJDSubmission } = require('../models/JdMapping');
const { getCompanyUserIds, resolveCompanyId } = require('../utils/company');
const { customPaginateResponse, drfPaginate } = require('../utils/pagination');
const { computeRequirementStatus } = require('../utils/requirementStatus');
const { startOfDay, endOfDay, subDays } = require('date-fns');

function requirementJSON(r, client) {
  return {
    id: r.id,
    requirement_id: r.requirementId,
    title: r.title,
    client_id: r.clientId,
    client_name: client?.companyName || client?.clientName,
    client_details: client
      ? { id: client.id, name: client.clientName, company_name: client.companyName }
      : null,
    experience_required: r.experienceRequired,
    rate: r.rate,
    vendor_budget_range: r.vendorBudgetRange,
    time_zone: r.timeZone,
    jd_description: r.jdDescription,
    skills: r.skills,
    status: computeRequirementStatus(r),
    manual_status: r.manualStatus,
    manual_status_updated_at: r.manualStatusUpdatedAt,
    created_at: r.createdAt,
    created_by: r.createdById,
  };
}

async function myJDDetailJSON(r, clientMap, assignmentMap, submissionCounts) {
  const client = clientMap.get(r.clientId);
  const createdBy = r.createdById ? await User.findOne({ id: r.createdById }) : null;
  const assignments = assignmentMap.get(r.id) || [];
  const assigneeIds = assignments.map((a) => a.assignedToId);
  const assignees = assigneeIds.length
    ? await User.find({ id: { $in: assigneeIds } })
    : [];
  const assigneeMap = new Map(assignees.map((u) => [u.id, u]));

  return {
    id: r.id,
    requirement_id: r.requirementId,
    title: r.title,
    status: computeRequirementStatus(r),
    client_details: client
      ? { id: client.id, name: client.clientName, company_name: client.companyName }
      : null,
    experience_required: r.experienceRequired,
    rate: r.rate,
    vendor_budget_range: r.vendorBudgetRange,
    time_zone: r.timeZone,
    jd_description: r.jdDescription,
    skills: r.skills,
    manual_status: r.manualStatus,
    manual_status_updated_at: r.manualStatusUpdatedAt,
    created_by_details: createdBy
      ? {
          id: createdBy.id,
          name: `${createdBy.firstName} ${createdBy.lastName}`.trim(),
          email: createdBy.email,
        }
      : null,
    created_at: r.createdAt,
    assigned_to_details: assignments.map((a) => {
      const u = assigneeMap.get(a.assignedToId);
      return u
        ? { id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), email: u.email }
        : null;
    }).filter(Boolean),
    total_submissions: submissionCounts.get(r.id) || 0,
  };
}

async function create(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const requirementId = await generateRequirementId(companyId);
  const doc = await Requirement.create({
    title: req.body.title,
    clientId: parseInt(req.body.client_id, 10),
    experienceRequired: req.body.experience_required,
    rate: req.body.rate,
    vendorBudgetRange: req.body.vendor_budget_range,
    timeZone: req.body.time_zone,
    jdDescription: req.body.jd_description,
    skills: req.body.skills,
    requirementId,
    companyId,
    createdById: req.user.id,
  });
  const client = await Client.findOne({ id: doc.clientId });
  return res.status(201).json({
    message: 'Requirement created successfully',
    requirement: requirementJSON(doc, client),
  });
}

async function list(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const search = (req.query.search || '').trim();
  const statusFilter = (req.query.status || '').trim();

  const filter = { isDeleted: false, companyId };
  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { skills: new RegExp(search, 'i') },
      { requirementId: new RegExp(search, 'i') },
    ];
  }

  let items = await Requirement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  const total = await Requirement.countDocuments(filter);

  if (statusFilter) {
    items = items.filter((r) => computeRequirementStatus(r) === statusFilter);
  }

  const clients = await Client.find({ id: { $in: items.map((i) => i.clientId) } });
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const results = items.map((r) => requirementJSON(r, clientMap.get(r.clientId)));

  return res.json(customPaginateResponse(results, total, page, pageSize));
}

async function detail(req, res) {
  const r = await Requirement.findOne({ id: parseInt(req.params.pk, 10), isDeleted: false });
  if (!r) return res.status(404).json({ success: false });
  const client = await Client.findOne({ id: r.clientId });
  return res.json({ success: true, data: requirementJSON(r, client) });
}

async function update(req, res) {
  const r = await Requirement.findOne({ id: parseInt(req.params.pk, 10), isDeleted: false });
  if (!r) return res.status(404).json({ detail: 'Not found' });
  Object.assign(r, {
    title: req.body.title ?? r.title,
    clientId: req.body.client_id ? parseInt(req.body.client_id, 10) : r.clientId,
    experienceRequired: req.body.experience_required ?? r.experienceRequired,
    rate: req.body.rate ?? r.rate,
    vendorBudgetRange: req.body.vendor_budget_range ?? r.vendorBudgetRange,
    timeZone: req.body.time_zone ?? r.timeZone,
    jdDescription: req.body.jd_description ?? r.jdDescription,
    skills: req.body.skills ?? r.skills,
  });
  await r.save();
  const client = await Client.findOne({ id: r.clientId });
  return res.json({
    success: true,
    message: 'Requirement updated successfully',
    ...requirementJSON(r, client),
  });
}

async function softDelete(req, res) {
  await Requirement.updateOne({ id: parseInt(req.params.pk, 10) }, { isDeleted: true });
  return res.json({ message: 'Deleted' });
}

async function createAssignment(req, res) {
  const { requirement_id, assigned_to_ids } = req.body;
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const created = [];
  for (const assignedToId of assigned_to_ids || []) {
    const a = await RequirementAssignment.create({
      requirementId: requirement_id,
      assignedToId,
      assignedById: req.user.id,
      companyId,
    });
    created.push(a);
  }
  return res.status(201).json({ message: 'Assigned', assignments: created });
}

async function createSubmission(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const candidateId = parseInt(req.body.candidate_id, 10);
  const requirementId = parseInt(req.body.requirement_id, 10);

  const existing = await CandidateJDSubmission.findOne({ candidateId, requirementId });
  if (existing) {
    return res.status(201).json({ id: existing.id, message: 'Already submitted' });
  }

  try {
    const sub = await CandidateJDSubmission.create({
      candidateId,
      requirementId,
      submittedById: req.user.id,
      companyId,
    });
    return res.status(201).json({ id: sub.id, message: 'Submitted successfully' });
  } catch (err) {
    if (err.code === 11000 || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(201).json({ message: 'Already submitted' });
    }
    throw err;
  }
}

async function myJds(req, res) {
  const userId = req.user.id;
  const queryType = req.query.type || 'both';
  const search = (req.query.search || '').trim();
  const statusFilter = (req.query.status || '').trim().toUpperCase();

  const today = startOfDay(new Date());
  const yesterday = startOfDay(subDays(new Date(), 1));

  let rangeStart;
  let rangeEnd;
  if (queryType === 'today') {
    rangeStart = today;
    rangeEnd = endOfDay(today);
  } else if (queryType === 'yesterday') {
    rangeStart = yesterday;
    rangeEnd = endOfDay(yesterday);
  } else {
    rangeStart = yesterday;
    rangeEnd = endOfDay(today);
  }

  const assignments = await RequirementAssignment.find({ assignedToId: userId });
  const assignedReqIds = assignments.map((a) => a.requirementId);

  const [createdJds, assignedJds] = await Promise.all([
    Requirement.find({
      createdById: userId,
      isDeleted: false,
      createdAt: { $gte: rangeStart, $lte: rangeEnd },
    }),
    assignedReqIds.length
      ? Requirement.find({
          id: { $in: assignedReqIds },
          isDeleted: false,
          createdAt: { $gte: rangeStart, $lte: rangeEnd },
        })
      : [],
  ]);

  const merged = new Map();
  [...createdJds, ...assignedJds].forEach((r) => merged.set(r.id, r));
  let items = [...merged.values()];

  if (search) {
    const re = new RegExp(search, 'i');
    items = items.filter(
      (r) =>
        re.test(r.title || '') ||
        re.test(r.requirementId || '') ||
        re.test(r.skills || '')
    );
  }

  if (statusFilter && ['HOT', 'WARM', 'COLD'].includes(statusFilter)) {
    items = items.filter((r) => computeRequirementStatus(r) === statusFilter);
  }

  const statusOrder = { HOT: 1, WARM: 2, COLD: 3 };
  items.sort((a, b) => {
    const sa = statusOrder[computeRequirementStatus(a)] || 4;
    const sb = statusOrder[computeRequirementStatus(b)] || 4;
    if (sa !== sb) return sa - sb;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const clients = await Client.find({ id: { $in: items.map((i) => i.clientId) } });
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const allAssignments = await RequirementAssignment.find({
    requirementId: { $in: items.map((i) => i.id) },
  });
  const assignmentMap = new Map();
  allAssignments.forEach((a) => {
    if (!assignmentMap.has(a.requirementId)) assignmentMap.set(a.requirementId, []);
    assignmentMap.get(a.requirementId).push(a);
  });

  const submissionCounts = new Map();
  for (const r of items) {
    const count = await CandidateJDSubmission.countDocuments({ requirementId: r.id });
    submissionCounts.set(r.id, count);
  }

  const results = await Promise.all(
    items.map((r) => myJDDetailJSON(r, clientMap, assignmentMap, submissionCounts))
  );

  return res.json({
    success: true,
    type: queryType,
    status_filter: statusFilter || 'ALL',
    count: results.length,
    stats: {
      total: results.length,
      created_by_me: createdJds.length,
      assigned_to_me: assignedJds.length,
      hot_count: results.filter((r) => r.status === 'HOT').length,
      warm_count: results.filter((r) => r.status === 'WARM').length,
      cold_count: results.filter((r) => r.status === 'COLD').length,
    },
    results,
  });
}

async function companyJds(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const queryType = req.query.type || 'all';
  const search = (req.query.search || '').trim();

  const filter = { companyId, isDeleted: false };
  const today = startOfDay(new Date());
  const yesterday = startOfDay(subDays(new Date(), 1));

  if (queryType === 'today') {
    filter.createdAt = { $gte: today, $lte: endOfDay(today) };
  } else if (queryType === 'yesterday') {
    filter.createdAt = { $gte: yesterday, $lte: endOfDay(yesterday) };
  } else if (queryType === 'both') {
    filter.createdAt = { $gte: yesterday, $lte: endOfDay(today) };
  }

  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { skills: new RegExp(search, 'i') },
      { requirementId: new RegExp(search, 'i') },
    ];
  }

  const items = await Requirement.find(filter).sort({ createdAt: -1 });
  const clients = await Client.find({ id: { $in: items.map((i) => i.clientId) } });
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const results = items.map((r) => requirementJSON(r, clientMap.get(r.clientId)));
  return res.json({
    success: true,
    type: queryType,
    results,
    stats: { total: results.length },
  });
}

async function updateStatus(req, res) {
  const r = await Requirement.findOne({ id: parseInt(req.params.pk, 10) });
  if (!r) return res.status(404).json({ detail: 'Not found' });
  r.manualStatus = req.body.status;
  r.manualStatusUpdatedAt = new Date();
  await r.save();
  return res.json({ message: 'Status updated', status: r.manualStatus });
}

async function companyAvailable(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const assigned = await RequirementAssignment.find({ companyId });
  const assignedIds = new Set(assigned.map((a) => a.requirementId));
  const items = await Requirement.find({ companyId, isDeleted: false }).sort({ createdAt: -1 });
  const available = items.filter((r) => !assignedIds.has(r.id));
  const clients = await Client.find({ id: { $in: available.map((i) => i.clientId) } });
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  return res.json({
    success: true,
    results: available.map((r) => requirementJSON(r, clientMap.get(r.clientId))),
  });
}

module.exports = {
  create,
  list,
  detail,
  update,
  softDelete,
  createAssignment,
  createSubmission,
  myJds,
  companyJds,
  updateStatus,
  companyAvailable,
};
