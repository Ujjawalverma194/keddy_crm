const Candidate = require('../models/Candidate');
const Vendor = require('../models/Vendor');
const Client = require('../models/Client');
const { RequirementAssignment, CandidateJDSubmission } = require('../models/JdMapping');
const { Attendance, DailyWorkReport, CompanySettings } = require('../models/Attendance');

const PIPELINE_STATUSES = ['SCREENING', 'L1', 'L2', 'L3', 'OTHER'];

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

function formatTime(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function computePerformance(sourced, submitted, targetSourcing, targetSubmission) {
  const srcTarget = targetSourcing || 5;
  const subTarget = targetSubmission || 2;
  const sourcingPct = Math.min(100, Math.round((sourced / srcTarget) * 100)) || 0;
  const submissionPct = Math.min(100, Math.round((submitted / subTarget) * 100)) || 0;
  const performance_percentage = Math.round((sourcingPct + submissionPct) / 2);

  let color_code = 'RED';
  if (performance_percentage >= 80) color_code = 'GREEN';
  else if (performance_percentage >= 50) color_code = 'YELLOW';

  return {
    color_code,
    performance_percentage,
    sourced_today: sourced,
    submitted_today: submitted,
  };
}

async function countSourcedToday(userId) {
  const { start, end } = todayRange();
  return Candidate.countDocuments({
    createdById: userId,
    isDeleted: false,
    createdAt: { $gte: start, $lt: end },
  });
}

async function countSubmittedToday(userId) {
  const { start, end } = todayRange();
  return Candidate.countDocuments({
    isDeleted: false,
    verificationStatus: true,
    clientId: { $ne: null },
    createdAt: { $gte: start, $lt: end },
    $or: [{ createdById: userId }, { submittedToId: userId }],
  });
}

async function countSourcedInRange(userId, start, end) {
  return Candidate.countDocuments({
    createdById: userId,
    isDeleted: false,
    createdAt: { $gte: start, $lt: end },
  });
}

async function countSubmittedInRange(userId, start, end) {
  return Candidate.countDocuments({
    isDeleted: false,
    verificationStatus: true,
    clientId: { $ne: null },
    createdAt: { $gte: start, $lt: end },
    $or: [{ createdById: userId }, { submittedToId: userId }],
  });
}

async function buildTodayMetrics(userId, companyId) {
  const date = todayRange().start;
  const settings = await CompanySettings.findOne({ companyId });
  const targetSourcing = settings?.defaultSourcingTarget ?? 5;
  const targetSubmission = settings?.defaultSubmissionTarget ?? 2;

  const [attendance, report, sourcedToday, submittedToday] = await Promise.all([
    Attendance.findOne({ userId, date }),
    DailyWorkReport.findOne({ userId, date }),
    countSourcedToday(userId),
    countSubmittedToday(userId),
  ]);

  const performance = computePerformance(
    sourcedToday,
    submittedToday,
    targetSourcing,
    targetSubmission
  );

  return {
    performance,
    target: {
      target_sourcing: targetSourcing,
      target_submission: targetSubmission,
    },
    attendance: {
      status: attendance?.status || null,
      checked_in: Boolean(attendance?.checkIn),
      checked_out: Boolean(attendance?.checkOut),
      check_in_time: formatTime(attendance?.checkIn),
      check_out_time: formatTime(attendance?.checkOut),
    },
    report_submitted: Boolean(report),
  };
}

async function buildMonthlyPerformance(userId) {
  const { start, end } = monthRange();
  const [total_sourced, total_submitted] = await Promise.all([
    countSourcedInRange(userId, start, end),
    countSubmittedInRange(userId, start, end),
  ]);
  return { total_sourced, total_submitted };
}

async function buildOverallStats(userId) {
  const { start, end } = todayRange();
  const [
    total_vendors_created,
    total_clients_created,
    total_candidates_created,
    total_candidates_submitted,
    candidates_in_pipeline,
    interviews_today,
    assigned_requirements,
    submitted_jds,
  ] = await Promise.all([
    Vendor.countDocuments({ createdById: userId, isDeleted: false }),
    Client.countDocuments({ createdById: userId, isDeleted: false }),
    Candidate.countDocuments({ createdById: userId, isDeleted: false }),
    Candidate.countDocuments({
      createdById: userId,
      isDeleted: false,
      verificationStatus: true,
      clientId: { $ne: null },
    }),
    Candidate.countDocuments({
      isDeleted: false,
      verificationStatus: true,
      mainStatus: { $in: PIPELINE_STATUSES },
      $or: [{ createdById: userId }, { submittedToId: userId }],
    }),
    Candidate.countDocuments({
      isDeleted: false,
      $or: [{ createdById: userId }, { submittedToId: userId }],
      scheduledDatetime: { $gte: start, $lt: end },
    }),
    RequirementAssignment.countDocuments({ assignedToId: userId }),
    CandidateJDSubmission.countDocuments({ submittedById: userId }),
  ]);

  return {
    total_vendors_created,
    total_clients_created,
    total_candidates_created,
    total_candidates_submitted,
    candidates_in_pipeline,
    interviews_today,
    assigned_requirements,
    submitted_jds,
  };
}

module.exports = {
  buildTodayMetrics,
  buildMonthlyPerformance,
  buildOverallStats,
  computePerformance,
  countSourcedToday,
  countSubmittedToday,
};
