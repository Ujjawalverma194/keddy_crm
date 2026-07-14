const Vendor = require('../../models/Vendor');
const Client = require('../../models/Client');
const Candidate = require('../../models/Candidate');
const { Requirement } = require('../../models/Requirement');
const { RequirementAssignment, CandidateJDSubmission } = require('../../models/JdMapping');
const { candidatesToJSON } = require('../../utils/formatters');
const { startOfDay, subDays } = require('date-fns');

const PIPELINE_STATUSES = ['INTERNAL SCREENING', 'CLIENT SCREENING', 'L1', 'L2', 'L3', 'OTHER'];

function todayRange() {
  const start = startOfDay(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function attachSubmissionRequirementDetails(formattedCandidates, submissions) {
  if (!formattedCandidates?.length || !submissions?.length) return formattedCandidates || [];

  const submissionMap = new Map();
  submissions.forEach((submission) => {
    if (!submission?.candidateId) return;
    const existing = submissionMap.get(submission.candidateId);
    if (!existing || new Date(submission.createdAt) > new Date(existing.createdAt)) {
      submissionMap.set(submission.candidateId, submission);
    }
  });

  const requirementIds = [...new Set(
    [...submissionMap.values()].map((submission) => submission.requirementId).filter(Boolean)
  )];
  const requirements = requirementIds.length
    ? await Requirement.find({ id: { $in: requirementIds }, isDeleted: false })
    : [];
  const requirementMap = new Map(requirements.map((requirement) => [requirement.id, requirement]));

  const clientIds = [...new Set(requirements.map((requirement) => requirement.clientId).filter(Boolean))];
  const clients = clientIds.length ? await Client.find({ id: { $in: clientIds } }) : [];
  const clientMap = new Map(clients.map((client) => [client.id, client]));

  return formattedCandidates.map((candidate) => {
    const submission = submissionMap.get(candidate.id);
    const requirement = submission?.requirementId ? requirementMap.get(submission.requirementId) : null;
    const client = requirement?.clientId ? clientMap.get(requirement.clientId) : null;

    return {
      ...candidate,
      submission_id: submission?.id,
      requirementId: submission?.requirementId,
      jd_mapping: submission?.requirementId,
      jd_mapping_id: submission?.requirementId,
      submittedById: submission?.submittedById,
      submission_created_at: submission?.createdAt,
      requirement: requirement ? {
        id: requirement.id,
        requirement_id: requirement.requirementId,
        title: requirement.title,
        client_details: client ? {
          id: client.id,
          name: client.clientName,
          company_name: client.companyName,
        } : null,
        client_name: client?.companyName || client?.clientName || null,
        created_at: requirement.createdAt,
      } : null,
      jd_title: requirement?.title || candidate.jd_title,
      requirement_title: requirement?.title || candidate.requirement_title,
      requirement_code: requirement?.requirementId || candidate.requirement_code,
      jd_company_name: client?.companyName || client?.clientName || candidate.jd_company_name,
      jd_created_at: requirement?.createdAt || candidate.jd_created_at,
    };
  });
}

function clientSubmittedFilter(extra = {}) {
  return {
    isDeleted: false,
    verificationStatus: true,
    clientId: { $ne: null },
    ...extra,
  };
}

async function stats(req, res) {
  if (req.user.role !== 'EMPLOYEE') {
    return res.status(403).json({ detail: 'Only employees allowed.' });
  }
  const userId = req.user.id;
  const { start, end } = todayRange();

  const { VendorPOC } = require('../../models/sequelize/init');
  const { Op } = require('sequelize');
  const pocs = await VendorPOC.findAll({
    where: { assignedEmployeeIds: { [Op.contains]: [userId] } },
    attributes: ['vendorId']
  });
  const assignedVendorIds = [...new Set(pocs.map(p => p.vendorId))];
  
  const vendorOr = [{ createdById: userId }];
  if (assignedVendorIds.length > 0) {
    vendorOr.push({ id: { $in: assignedVendorIds } });
  }

  const { ClientPOC } = require('../../models/sequelize/init');
  const clientPocs = await ClientPOC.findAll({
    where: { assignedEmployeeIds: { [Op.contains]: [userId] } },
    attributes: ['clientId']
  });
  const assignedClientIds = [...new Set(clientPocs.map(p => p.clientId))];
  
  const clientOr = [{ createdById: userId }];
  if (assignedClientIds.length > 0) {
    clientOr.push({ id: { $in: assignedClientIds } });
  }

  const [totalVendors, totalClients, totalProfiles, todayProfiles, todaySubmitted, totalPipelines, todayCreatedJds, todayAssignedJds] =
    await Promise.all([
      Vendor.countDocuments({
        isDeleted: false,
        $or: vendorOr,
      }),
      Client.countDocuments({
        isDeleted: false,
        $or: clientOr,
      }),
      Candidate.countDocuments({ createdById: userId, isDeleted: false }),
      Candidate.countDocuments({
        createdById: userId,
        isDeleted: false,
        createdAt: { $gte: start, $lt: end },
      }),
      Candidate.countDocuments(clientSubmittedFilter({
        createdAt: { $gte: start, $lt: end },
        $or: [{ createdById: userId }, { submittedToId: userId }],
      })),
      Candidate.countDocuments({
        isDeleted: false,
        verificationStatus: true,
        mainStatus: { $in: PIPELINE_STATUSES },
        subStatus: { $ne: 'REJECTED' },
        $or: [{ createdById: userId }, { submittedToId: userId }],
      }),
      Requirement.countDocuments({
        createdById: userId,
        isDeleted: false,
        createdAt: { $gte: start, $lt: end },
      }),
      RequirementAssignment.find({ assignedToId: userId }).then(async (assignments) => {
        const reqIds = assignments.map((a) => a.requirementId);
        if (!reqIds.length) return 0;
        return Requirement.countDocuments({
          id: { $in: reqIds },
          isDeleted: false,
          createdAt: { $gte: start, $lt: end },
        });
      }),
    ]);

  return res.json({
    user_name: `${req.user.firstName} ${req.user.lastName}`,
    total_vendors: totalVendors,
    total_clients: totalClients,
    total_profiles: totalProfiles,
    today_profiles: todayProfiles,
    today_submitted_profiles: todaySubmitted,
    total_pipelines: totalPipelines,
    today_requirements: todayCreatedJds + todayAssignedJds,
  });
}

async function todayCandidates(req, res) {
  const { start, end } = todayRange();
  const items = await Candidate.find({
    createdById: req.user.id,
    isDeleted: false,
    createdAt: { $gte: start, $lt: end },
  }).sort({ createdAt: -1 });
  return res.json(await candidatesToJSON(items));
}

async function todayVerified(req, res) {
  const { start, end } = todayRange();
  const items = await Candidate.find(clientSubmittedFilter({
    createdAt: { $gte: start, $lt: end },
    $or: [{ createdById: req.user.id }, { submittedToId: req.user.id }],
  }));
  return res.json(await candidatesToJSON(items));
}

async function activePipeline(req, res) {
  const items = await Candidate.find({
    isDeleted: false,
    verificationStatus: true,
    mainStatus: { $in: PIPELINE_STATUSES },
    subStatus: { $ne: 'REJECTED' },
    $or: [{ createdById: req.user.id }, { submittedToId: req.user.id }],
  }).sort({ createdAt: -1 });
  return res.json(await candidatesToJSON(items));
}

async function todayTeamSubmissions(req, res) {
  if (req.user.role !== 'EMPLOYEE') {
    return res.status(403).json({ detail: 'Only employees allowed.' });
  }
  const { start, end } = todayRange();
  const userId = req.user.id;

  const candidateFilter = {
    isDeleted: false,
    clientId: null,
    verificationStatus: true,
    $or: [{ createdById: userId }, { submittedToId: userId }],
  };

  const relatedCandidates = await Candidate.find(candidateFilter);
  const candidateIds = relatedCandidates.map((candidate) => candidate.id);
  if (!candidateIds.length) return res.json([]);

  const submissions = await CandidateJDSubmission.find({
    candidateId: { $in: candidateIds },
    createdAt: { $gte: start, $lt: end },
  }).sort({ createdAt: -1 });

  const latestSubmissionByCandidate = new Map();
  submissions.forEach((submission) => {
    if (!latestSubmissionByCandidate.has(submission.candidateId)) {
      latestSubmissionByCandidate.set(submission.candidateId, submission);
    }
  });

  const submittedCandidateIds = [...latestSubmissionByCandidate.keys()];
  const items = relatedCandidates
    .filter((candidate) => submittedCandidateIds.includes(candidate.id))
    .sort((a, b) => {
      const aSubmission = latestSubmissionByCandidate.get(a.id);
      const bSubmission = latestSubmissionByCandidate.get(b.id);
      return new Date(bSubmission?.createdAt || b.createdAt) - new Date(aSubmission?.createdAt || a.createdAt);
    });

  const formatted = await candidatesToJSON(items);
  return res.json(await attachSubmissionRequirementDetails(formatted, submissions));
}

async function last7DaysVerified(req, res) {
  const since = subDays(new Date(), 7);
  const items = await Candidate.find(clientSubmittedFilter({
    createdAt: { $gte: since },
    $or: [{ createdById: req.user.id }, { submittedToId: req.user.id }],
  })).sort({ createdAt: -1 });
  return res.json(await candidatesToJSON(items));
}

async function allTeamSubmissions(req, res) {
  const { getCompanyUserIds } = require('../../utils/company');

  const ids = await getCompanyUserIds(req.user);

  const submissions = await CandidateJDSubmission.find({
    submittedById: { $in: ids },
  })
    .sort({ createdAt: -1 })
    .limit(100);

  const candidateIds = submissions.map((s) => s.candidateId);

  const candidates = await Candidate.find({
    id: { $in: candidateIds },
    isDeleted: false,
  });

  const formattedCandidates = await candidatesToJSON(candidates);

  const submissionMap = new Map(
    submissions.map((s) => [s.candidateId, s])
  );

  const results = await attachSubmissionRequirementDetails(formattedCandidates, submissions);

  return res.json({ results });
}

module.exports = {
  stats,
  todayCandidates,
  todayVerified,
  activePipeline,
  todayTeamSubmissions,
  last7DaysVerified,
  allTeamSubmissions,
};
