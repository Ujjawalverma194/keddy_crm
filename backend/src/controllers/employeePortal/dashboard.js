const Vendor = require('../../models/Vendor');
const Client = require('../../models/Client');
const Candidate = require('../../models/Candidate');
const { Requirement } = require('../../models/Requirement');
const { RequirementAssignment, CandidateJDSubmission } = require('../../models/JdMapping');
const { candidatesToJSON } = require('../../utils/formatters');
const { startOfDay, subDays } = require('date-fns');

const PIPELINE_STATUSES = ['SCREENING', 'L1', 'L2', 'L3', 'OTHER'];

function todayRange() {
  const start = startOfDay(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function stats(req, res) {
  if (req.user.role !== 'EMPLOYEE') {
    return res.status(403).json({ detail: 'Only employees allowed.' });
  }
  const userId = req.user.id;
  const { start, end } = todayRange();

  const [totalVendors, totalClients, totalProfiles, todayProfiles, todaySubmitted, totalPipelines, todayCreatedJds, todayAssignedJds] =
    await Promise.all([
      Vendor.countDocuments({
        isDeleted: false,
        $or: [{ createdById: userId }, { assignedEmployeeIds: userId }],
      }),
      Client.countDocuments({
        isDeleted: false,
        $or: [{ createdById: userId }, { assignedEmployeeIds: userId }],
      }),
      Candidate.countDocuments({ createdById: userId, isDeleted: false }),
      Candidate.countDocuments({
        createdById: userId,
        isDeleted: false,
        createdAt: { $gte: start, $lt: end },
      }),
      Candidate.countDocuments({
        isDeleted: false,
        verificationStatus: true,
        clientId: { $ne: null },
        createdAt: { $gte: start, $lt: end },
        $or: [{ createdById: userId }, { submittedToId: userId }],
      }),
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
  const items = await Candidate.find({
    isDeleted: false,
    verificationStatus: true,
    createdAt: { $gte: start, $lt: end },
    $or: [{ createdById: req.user.id }, { submittedToId: req.user.id }],
  });
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

  // Candidates submitted TO this user today, not created by them (matches Django)
  const items = await Candidate.find({
    submittedToId: userId,
    createdById: { $ne: userId },
    isDeleted: false,
    createdAt: { $gte: start, $lt: end },
  }).sort({ createdAt: -1 });

  return res.json(await candidatesToJSON(items));
}

async function last7DaysVerified(req, res) {
  const since = subDays(new Date(), 7);
  const items = await Candidate.find({
    isDeleted: false,
    verificationStatus: true,
    createdAt: { $gte: since },
    $or: [{ createdById: req.user.id }, { submittedToId: req.user.id }],
  }).sort({ createdAt: -1 });
  return res.json(await candidatesToJSON(items));
}

async function allTeamSubmissions(req, res) {
  const { getCompanyUserIds } = require('../../utils/company');
  const ids = await getCompanyUserIds(req.user);
  const items = await CandidateJDSubmission.find({ submittedById: { $in: ids } })
    .sort({ createdAt: -1 })
    .limit(100);
  return res.json({ results: items });
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
