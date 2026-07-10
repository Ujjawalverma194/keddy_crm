const Client = require('../models/Client');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Vendor = require('../models/Vendor');
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


function userJSON(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
    number: u.number || u.phoneNumber || null,
    role: u.role,
  };
}

async function assignmentListJSON(a, requirementMap, userMap) {
  const r = requirementMap.get(a.requirementId);
  const assignedTo = userMap.get(a.assignedToId);
  const assignedBy = userMap.get(a.assignedById);
  return {
    id: a.id,
    requirement: a.requirementId,
    requirement_id_display: r?.requirementId || null,
    requirement_title: r?.title || null,
    assigned_to: a.assignedToId,
    assigned_to_name: assignedTo?.email || null,
    assigned_to_full_name: assignedTo ? `${assignedTo.firstName || ''} ${assignedTo.lastName || ''}`.trim() : null,
    assigned_by: a.assignedById,
    assigned_by_name: assignedBy?.email || null,
    assigned_date: a.createdAt,
    company_name: userMap.get(a.companyId)?.email || null,
  };
}

async function assignmentDetailJSON(a) {
  const [r, assignedTo, assignedBy, client] = await Promise.all([
    Requirement.findOne({ id: a.requirementId }),
    a.assignedToId ? User.findOne({ id: a.assignedToId }) : null,
    a.assignedById ? User.findOne({ id: a.assignedById }) : null,
    null,
  ]);
  let rClient = null;
  if (r?.clientId) rClient = await Client.findOne({ id: r.clientId });
  return {
    id: a.id,
    requirement_details: r ? {
      id: r.id,
      requirement_id: r.requirementId,
      title: r.title,
      client: rClient?.companyName || rClient?.clientName || null,
    } : null,
    assigned_to_details: userJSON(assignedTo),
    assigned_by_details: userJSON(assignedBy),
    assigned_date: a.createdAt,
  };
}

function scopedAssignmentFilter(req) {
  const filter = {};
  if (req.user.role !== 'CENTRAL_ADMIN') {
    const companyId = resolveCompanyId(req.user) || req.user.id;
    filter.companyId = companyId;
  }
  return filter;
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
  const statusFilter = (req.query.status || '').trim().toUpperCase();
  const queryType = req.query.type || 'all';

  const filter = { isDeleted: false, companyId };
  const today = startOfDay(new Date());
  const yesterday = startOfDay(subDays(new Date(), 1));

  if (queryType === 'today') {
    filter.createdAt = { $gte: today, $lte: endOfDay(today) };
  } else if (queryType === 'yesterday') {
    filter.createdAt = { $gte: yesterday, $lte: endOfDay(yesterday) };
  }

  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { skills: new RegExp(search, 'i') },
      { requirementId: new RegExp(search, 'i') },
    ];
  }

  let allItems = await Requirement.find(filter).sort({ createdAt: -1 });

  if (statusFilter && ['HOT', 'WARM', 'COLD'].includes(statusFilter)) {
    allItems = allItems.filter((r) => computeRequirementStatus(r) === statusFilter);
  }

  const total = allItems.length;
  const items = allItems.slice(skip, skip + limit);
  const clients = await Client.find({ id: { $in: items.map((i) => i.clientId) } });
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const creatorIds = [...new Set(items.map((i) => i.createdById).filter(Boolean))];
  const creators = creatorIds.length ? await User.find({ id: { $in: creatorIds } }) : [];
  const creatorMap = new Map(creators.map((u) => [u.id, u]));

  const results = items.map((r) => {
    const creator = creatorMap.get(r.createdById);
    return {
      ...requirementJSON(r, clientMap.get(r.clientId)),
      created_by_details: creator
        ? {
            id: creator.id,
            name: `${creator.firstName || ''} ${creator.lastName || ''}`.trim(),
            email: creator.email,
          }
        : null,
    };
  });

  return res.json(customPaginateResponse(results, total, page, pageSize));
}

function safeName(u) {
  if (!u) return null;
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || null;
}

async function detail(req, res) {
  const requirementId = parseInt(req.params.pk, 10);
  const r = await Requirement.findOne({ id: requirementId, isDeleted: false });
  if (!r) return res.status(404).json({ success: false });

  const [client, assignments, submissions] = await Promise.all([
    Client.findOne({ id: r.clientId }),
    RequirementAssignment.find({ requirementId: r.id }),
    CandidateJDSubmission.find({ requirementId: r.id }).sort({ createdAt: -1 }),
  ]);

  const fallbackCreatorId =
    r.createdById ||
    assignments.find((a) => a.assignedById)?.assignedById ||
    client?.createdById ||
    r.companyId ||
    null;

  const userIds = [
    fallbackCreatorId,
    r.companyId,
    ...assignments.map((a) => a.assignedToId),
    ...assignments.map((a) => a.assignedById),
    ...submissions.map((s) => s.submittedById),
  ].filter(Boolean);
  const users = userIds.length ? await User.find({ id: { $in: [...new Set(userIds)] } }) : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const candidateIds = [...new Set(submissions.map((s) => s.candidateId).filter(Boolean))];
  const candidates = candidateIds.length ? await Candidate.find({ id: { $in: candidateIds }, isDeleted: false }) : [];
  const candidateMap = new Map(candidates.map((c) => [c.id, c]));

  const vendorIds = [...new Set(candidates.map((c) => c.vendorId).filter(Boolean))];
  const vendors = vendorIds.length ? await Vendor.find({ id: { $in: vendorIds } }) : [];
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  // The optional JD submission table can also receive internal/team submissions.
  // Requirement View counts should match actual client submissions for this JD.
  const clientSubmissions = submissions.filter((s) => {
    const candidate = candidateMap.get(s.candidateId);
    return candidate && String(candidate.clientId || '') === String(r.clientId || '');
  });

  const creator = userMap.get(fallbackCreatorId);
  const companyOwner = userMap.get(r.companyId);
  const base = requirementJSON(r, client);

  return res.json({
    success: true,
    data: {
      ...base,
      client_details: client
        ? {
            id: client.id,
            name: client.clientName,
            company_name: client.companyName,
            email: client.email || client.officialEmail || null,
            phone: client.phoneNumber || null,
          }
        : null,
      created_by_details: creator
        ? {
            id: creator.id,
            name: safeName(creator),
            email: creator.email,
            role: creator.role,
          }
        : null,
      company_details: companyOwner
        ? {
            id: companyOwner.id,
            name: safeName(companyOwner),
            email: companyOwner.email,
            company_name: safeName(companyOwner),
          }
        : null,
      assignments: assignments.map((a) => {
        const assignedTo = userMap.get(a.assignedToId);
        const assignedBy = userMap.get(a.assignedById);
        return {
          id: a.id,
          name: safeName(assignedTo),
          email: assignedTo?.email || null,
          assigned_to: a.assignedToId,
          assigned_by: a.assignedById,
          assigned_by_name: safeName(assignedBy),
          assigned_date: a.createdAt,
        };
      }),
      total_submissions: clientSubmissions.length,
      unique_candidates: new Set(clientSubmissions.map((s) => s.candidateId)).size,
      submissions: clientSubmissions.map((s) => {
        const candidate = candidateMap.get(s.candidateId);
        const vendor = candidate?.vendorId ? vendorMap.get(candidate.vendorId) : null;
        const submittedBy = userMap.get(s.submittedById);
        return {
          id: s.id,
          submission_date: s.createdAt,
          submitted_by: submittedBy
            ? { id: submittedBy.id, name: safeName(submittedBy), email: submittedBy.email }
            : null,
          candidate: candidate
            ? {
                id: candidate.id,
                name: candidate.candidateName,
                technology: candidate.technology,
                experience_calculated: candidate.yearsOfExperienceCalculated ?? candidate.yearsOfExperienceManual,
                vendor_rate: candidate.vendorRate,
                vendor_rate_type: candidate.vendorRateType,
                client_rate: candidate.clientRate,
                client_rate_type: candidate.clientRateType,
                main_status: candidate.mainStatus,
                vendor: vendor
                  ? {
                      id: vendor.id,
                      name: vendor.name,
                      company_name: vendor.companyName,
                    }
                  : null,
              }
            : null,
        };
      }),
    },
  });
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
  const requirementId = parseInt(req.params.pk, 10);
  const r = await Requirement.findOne({ id: requirementId, isDeleted: false });

  if (!r) return res.status(404).json({ detail: 'Not found' });

  let canDelete = false;

  if (['ADMIN', 'SUB_ADMIN', 'CENTRAL_ADMIN'].includes(req.user.role)) {
    canDelete = true;
  } else if (String(r.createdById) === String(req.user.id)) {
    canDelete = true;
  } else if (req.user.role === 'EMPLOYEE') {
    const User = require('../models/User');
    const creator = await User.findOne({ id: r.createdById });
    if (creator && (String(creator.teamLeaderId) === String(req.user.id) || String(creator.parentUserId) === String(req.user.id))) {
      canDelete = true;
    }
  }

  if (!canDelete) {
    return res.status(403).json({ detail: 'You can delete only requirements created by you or your team.' });
  }

  await Requirement.updateOne({ id: requirementId }, { isDeleted: true });
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


async function listAssignments(req, res) {
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const search = (req.query.search || '').trim();
  const filter = scopedAssignmentFilter(req);

  let assignments = await RequirementAssignment.find(filter).sort({ createdAt: -1 });
  const reqIds = [...new Set(assignments.map((a) => a.requirementId).filter(Boolean))];
  const userIds = [...new Set(assignments.flatMap((a) => [a.assignedToId, a.assignedById, a.companyId]).filter(Boolean))];
  const [requirements, users] = await Promise.all([
    reqIds.length ? Requirement.find({ id: { $in: reqIds }, isDeleted: false }) : [],
    userIds.length ? User.find({ id: { $in: userIds } }) : [],
  ]);
  const requirementMap = new Map(requirements.map((r) => [r.id, r]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  if (search) {
    const re = new RegExp(search, 'i');
    assignments = assignments.filter((a) => {
      const r = requirementMap.get(a.requirementId);
      const u = userMap.get(a.assignedToId);
      return re.test(r?.title || '') || re.test(r?.requirementId || '') || re.test(u?.email || '') || re.test(`${u?.firstName || ''} ${u?.lastName || ''}`);
    });
  }

  const total = assignments.length;
  const pageItems = assignments.slice(skip, skip + limit);
  const results = await Promise.all(pageItems.map((a) => assignmentListJSON(a, requirementMap, userMap)));
  return res.json(customPaginateResponse(results, total, page, pageSize));
}

async function assignmentDetail(req, res) {
  const filter = { ...scopedAssignmentFilter(req), id: parseInt(req.params.pk, 10) };
  const assignment = await RequirementAssignment.findOne(filter);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
  return res.json({
    success: true,
    message: 'Assignment details fetched successfully',
    data: await assignmentDetailJSON(assignment),
  });
}

async function deleteAssignment(req, res) {
  if (!['SUB_ADMIN', 'CENTRAL_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "You don't have permission to delete this assignment" });
  }
  const filter = { ...scopedAssignmentFilter(req), id: parseInt(req.params.pk, 10) };
  const assignment = await RequirementAssignment.findOne(filter);
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
  const r = await Requirement.findOne({ id: assignment.requirementId });
  const assignedTo = assignment.assignedToId ? await User.findOne({ id: assignment.assignedToId }) : null;
  await RequirementAssignment.deleteOne({ id: assignment.id });
  return res.json({
    success: true,
    message: 'Assignment removed successfully',
    data: { requirement: r?.requirementId || assignment.requirementId, assigned_to: assignedTo?.email || null, assigned_date: assignment.createdAt },
  });
}

async function deleteSubmission(req, res) {
  const companyId = resolveCompanyId(req.user) || req.user.id;
  const filter = { id: parseInt(req.params.pk, 10) };
  if (req.user.role !== 'CENTRAL_ADMIN') filter.companyId = companyId;
  const submission = await CandidateJDSubmission.findOne(filter);
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
  if (req.user.role === 'EMPLOYEE' && submission.submittedById !== req.user.id) {
    return res.status(403).json({ success: false, message: "You don't have permission to delete this submission" });
  }
  const [candidate, requirement] = await Promise.all([
    require('../models/Candidate').findOne({ id: submission.candidateId }),
    Requirement.findOne({ id: submission.requirementId }),
  ]);
  await CandidateJDSubmission.deleteOne({ id: submission.id });
  return res.json({
    success: true,
    message: `Submission for candidate '${candidate?.candidateName || submission.candidateId}' removed successfully`,
    data: { submission_id: submission.id, candidate: candidate?.candidateName || submission.candidateId, requirement: requirement?.requirementId || submission.requirementId },
  });
}

async function myJds(req, res) {
  const userId = req.user.id;
  const queryType = req.query.type || 'both';
  const search = (req.query.search || '').trim();
  const statusFilter = (req.query.status || '').trim().toUpperCase();

  const today = startOfDay(new Date());
  const yesterday = startOfDay(subDays(new Date(), 1));

  const createdFilter = { createdById: userId, isDeleted: false };
  const assignmentFilter = { assignedToId: userId };
  const assignedRequirementFilter = { isDeleted: false };

  if (queryType === 'today') {
    const dateRange = { $gte: today, $lte: endOfDay(today) };
    createdFilter.createdAt = dateRange;
    assignedRequirementFilter.createdAt = dateRange;
  } else if (queryType === 'yesterday') {
    const dateRange = { $gte: yesterday, $lte: endOfDay(yesterday) };
    createdFilter.createdAt = dateRange;
    assignedRequirementFilter.createdAt = dateRange;
  } else if (queryType === 'both' || queryType === 'today_yesterday') {
    const dateRange = { $gte: yesterday, $lte: endOfDay(today) };
    createdFilter.createdAt = dateRange;
    assignedRequirementFilter.createdAt = dateRange;
  }

  const assignments = await RequirementAssignment.find(assignmentFilter);
  const assignedReqIds = [...new Set(assignments.map((a) => a.requirementId).filter(Boolean))];

  const [createdJds, assignedJds] = await Promise.all([
    Requirement.find(createdFilter),
    assignedReqIds.length
      ? Requirement.find({
          id: { $in: assignedReqIds },
          ...assignedRequirementFilter,
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

  const requirementIds = items.map((i) => i.id);
  
  const assignments = requirementIds.length
    ? await RequirementAssignment.find({ requirementId: { $in: requirementIds } })
    : [];
  const assignedUserIds = assignments.map(a => a.assignedToId).filter(Boolean);
  const createdUserIds = items.map(i => i.createdById).filter(Boolean);
  const userIdsToFetch = [...new Set([...assignedUserIds, ...createdUserIds])];
  const users = userIdsToFetch.length ? await User.find({ id: { $in: userIdsToFetch } }) : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  const submissions = requirementIds.length
    ? await CandidateJDSubmission.find({ requirementId: { $in: requirementIds }, companyId })
    : [];

  const submissionCandidateIds = [...new Set(submissions.map((s) => s.candidateId).filter(Boolean))];
  const submittedCandidates = submissionCandidateIds.length
    ? await Candidate.find({ id: { $in: submissionCandidateIds }, isDeleted: false })
    : [];
  const candidateMap = new Map(submittedCandidates.map((c) => [c.id, c]));

  const submissionCounts = new Map();
  submissions.forEach((submission) => {
    const candidate = candidateMap.get(submission.candidateId);
    const requirement = items.find((item) => item.id === submission.requirementId);

    if (!requirement) return;

    // Count only actual client submissions for the requirement's client.
    // This keeps internal/team submissions separate from Submitted Profiles counts.
    if (candidate && String(candidate.clientId || '') === String(requirement.clientId || '')) {
      submissionCounts.set(
        submission.requirementId,
        (submissionCounts.get(submission.requirementId) || 0) + 1,
      );
    }
  });

  const results = items.map((r) => {
    const creator = userMap.get(r.createdById);
    const reqAssignments = assignments.filter(a => String(a.requirementId) === String(r.id));

    return {
      ...requirementJSON(r, clientMap.get(r.clientId)),
      created_by_details: creator ? { id: creator.id, name: `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || creator.name } : null,
      assigned_to_details: reqAssignments.map(a => {
        const u = userMap.get(a.assignedToId);
        return u ? { assignment_id: a.id, id: u.id, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name } : null;
      }).filter(Boolean),
      total_submissions: submissionCounts.get(r.id) || 0,
    };
  });

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
  listAssignments,
  assignmentDetail,
  deleteAssignment,
  createSubmission,
  deleteSubmission,
  myJds,
  companyJds,
  updateStatus,
  companyAvailable,
};
