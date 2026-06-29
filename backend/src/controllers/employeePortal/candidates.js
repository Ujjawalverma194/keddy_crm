const Candidate = require('../../models/Candidate');
const User = require('../../models/User');
const { CandidateStatusHistory, CandidateRemarkHistory } = require('../../models/CandidateHistory');
const { getCompanyUserIds, resolveCompanyId } = require('../../utils/company');
const { drfPaginate, drfResponse } = require('../../utils/pagination');
const { candidateToJSON, candidatesToJSON } = require('../../utils/formatters');
const { parseResumeFile } = require('../../services/resumeParser');
const { relPath } = require('../../middleware/upload');
const { Invoice } = require('../../models/Invoice');
const { TimeSheet, VendorInvoice } = require('../../models/Documents');
const { mediaUrl } = require('../../utils/serialize');


function getUploadedResumeFile(req) {
  if (req.file) return req.file;

  const files = req.files || {};

  if (Array.isArray(files.resume) && files.resume.length > 0) {
    return files.resume[0];
  }

  if (files.resume && !Array.isArray(files.resume)) {
    return files.resume;
  }

  if (Array.isArray(files) && files.length > 0) {
    return files.find((file) => file.fieldname === 'resume') || files[0];
  }

  return null;
}

function getUploadedFilePath(file) {
  if (!file) return null;
  return file.path || file.filepath || file.tempFilePath || file.location || file.key || null;
}

function getResumeRelativePath(file) {
  const filePath = getUploadedFilePath(file);
  return filePath ? relPath(filePath) : null;
}

function parseBool(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1' || value === 1) return true;
  if (value === false || value === 'false' || value === '0' || value === 0) return false;
  return undefined;
}

/** Only apply fields present in the request (matches Django partial update). */
function applyCandidatePatch(candidate, b) {
  if (b.candidate_name !== undefined) candidate.candidateName = b.candidate_name;
  if (b.candidate_email !== undefined) candidate.candidateEmail = b.candidate_email;
  if (b.candidate_number !== undefined) candidate.candidateNumber = b.candidate_number;
  if (b.years_of_experience_manual !== undefined) {
    candidate.yearsOfExperienceManual = b.years_of_experience_manual;
  }
  if (b.years_of_experience_calculated !== undefined && b.years_of_experience_calculated !== '') {
    candidate.yearsOfExperienceCalculated = parseFloat(b.years_of_experience_calculated);
  }
  if (b.skills !== undefined) candidate.skills = b.skills;
  if (b.technology !== undefined) candidate.technology = b.technology;

  if (b.vendor !== undefined && b.vendor !== '') candidate.vendorId = parseInt(b.vendor, 10);
  if (b.vendor_id !== undefined && b.vendor_id !== '') candidate.vendorId = parseInt(b.vendor_id, 10);
  if (b.vendor_rate !== undefined && b.vendor_rate !== '') {
    candidate.vendorRate = parseFloat(b.vendor_rate);
  }
  if (b.vendor_rate_type !== undefined) candidate.vendorRateType = b.vendor_rate_type;

  if (b.client !== undefined && b.client !== '') candidate.clientId = parseInt(b.client, 10);
  if (b.client_rate !== undefined && b.client_rate !== '') {
    candidate.clientRate = parseFloat(b.client_rate);
  }
  if (b.client_rate_type !== undefined) candidate.clientRateType = b.client_rate_type;

  if (b.submitted_to !== undefined && b.submitted_to !== '') {
    candidate.submittedToId = parseInt(b.submitted_to, 10);
  } else if (
    parseBool(b.verification_status) === true &&
    !candidate.clientId &&
    (b.client === undefined || b.client === '') &&
    candidate.submittedToId == null &&
    candidate.createdById
  ) {
    // Internal submission to self when only verification is toggled
    candidate.submittedToId = candidate.createdById;
  }

  if (b.main_status !== undefined) candidate.mainStatus = b.main_status;
  if (b.sub_status !== undefined) candidate.subStatus = b.sub_status;

  const verification = parseBool(b.verification_status);
  if (verification !== undefined) candidate.verificationStatus = verification;

  if (b.remark !== undefined) candidate.remark = b.remark;
  if (b.extra_details !== undefined) candidate.extraDetails = b.extra_details;

  const blocklisted = parseBool(b.is_blocklisted);
  if (blocklisted !== undefined) candidate.isBlocklisted = blocklisted;
  if (b.blocklisted_reason !== undefined) candidate.blocklistedReason = b.blocklisted_reason;
}

function buildCreateData(b) {
  const draft = Candidate.build();
  applyCandidatePatch(draft, b);
  return {
    candidateName: draft.candidateName || b.candidate_name,
    candidateEmail: draft.candidateEmail ?? b.candidate_email ?? null,
    candidateNumber: draft.candidateNumber ?? b.candidate_number ?? null,
    yearsOfExperienceManual: draft.yearsOfExperienceManual ?? b.years_of_experience_manual,
    yearsOfExperienceCalculated: draft.yearsOfExperienceCalculated,
    skills: draft.skills ?? b.skills,
    technology: draft.technology ?? b.technology,
    vendorId: draft.vendorId,
    vendorRate: draft.vendorRate,
    vendorRateType: draft.vendorRateType,
    clientId: draft.clientId,
    clientRate: draft.clientRate,
    clientRateType: draft.clientRateType,
    submittedToId: draft.submittedToId,
    mainStatus: draft.mainStatus || 'SUBMITTED',
    subStatus: draft.subStatus || 'NONE',
    verificationStatus: draft.verificationStatus ?? false,
    remark: draft.remark,
    extraDetails: draft.extraDetails,
    isBlocklisted: draft.isBlocklisted ?? false,
    blocklistedReason: draft.blocklistedReason,
  };
}

async function setCompany(candidate, user) {
  if (user.role === 'SUB_ADMIN') candidate.companyId = user.id;
  else if (user.parentUserId) candidate.companyId = user.parentUserId;
}

async function create(req, res) {
  const b = req.body || {};
  const data = buildCreateData(b);
  if (!data.candidateName) return res.status(400).json({ candidate_name: ['Required'] });

  const uploadedResume = getUploadedResumeFile(req);
  const uploadedResumePath = getResumeRelativePath(uploadedResume);

  const candidate = Candidate.build({
    ...data,
    createdById: req.user.id,
    changedById: req.user.id,
    resume: uploadedResumePath || undefined,
  });
  await setCompany(candidate, req.user);
  if (!candidate.submittedToId) candidate.submittedToId = req.user.id;
  await candidate.save();

  const json = await candidateToJSON(candidate);
  return res.status(201).json({
    message: 'Candidate created successfully',
    data: json,
  });
}

async function update(req, res) {
  const candidate = await Candidate.findOne({
    id: parseInt(req.params.pk || req.params.id, 10),
    isDeleted: false,
  });
  if (!candidate) return res.status(404).json({ detail: 'Not found.' });

  const oldStatus = candidate.mainStatus;
  const oldRemark = candidate.remark;

  applyCandidatePatch(candidate, req.body || {});

  const uploadedResume = getUploadedResumeFile(req);
  const uploadedResumePath = getResumeRelativePath(uploadedResume);

  if (uploadedResumePath) {
    candidate.resume = uploadedResumePath;
  }

  candidate.changedById = req.user.id;

  if (candidate.mainStatus && candidate.mainStatus !== oldStatus) {
    await CandidateStatusHistory.create({
      candidateId: candidate.id,
      oldStatus,
      newStatus: candidate.mainStatus,
      subStatus: candidate.subStatus,
      changedById: req.user.id,
    });
  }
  if (candidate.remark && candidate.remark !== oldRemark) {
    await CandidateRemarkHistory.create({
      candidateId: candidate.id,
      remark: candidate.remark,
      addedById: req.user.id,
    });
  }

  await candidate.save();
  const updatedJson = await candidateToJSON(candidate);
  return res.json({
    ...updatedJson,
    resume: mediaUrl(candidate.resume),
    message: 'Candidate updated successfully',
  });
}

async function list(req, res) {
  const companyIds = await getCompanyUserIds(req.user);
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const search = (req.query.search || '').trim();
  const tech = (req.query.technology || '').trim();
  const filter = { isDeleted: false, createdById: { $in: companyIds } };
  if (search) {
    filter.$or = [
      { candidateName: new RegExp(search, 'i') },
      { candidateEmail: new RegExp(search, 'i') },
      { technology: new RegExp(search, 'i') },
    ];
  }
  if (tech) filter.technology = new RegExp(tech, 'i');

  const [items, total] = await Promise.all([
    Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Candidate.countDocuments(filter),
  ]);
  const results = await candidatesToJSON(items);
  return res.json(drfResponse(results, total, page, pageSize));
}

async function listUser(req, res) {
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const search = (req.query.search || '').trim();
  const filter = { isDeleted: false, createdById: req.user.id };
  if (search) {
    filter.$or = [
      { candidateName: new RegExp(search, 'i') },
      { technology: new RegExp(search, 'i') },
    ];
  }
  const [items, total] = await Promise.all([
    Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Candidate.countDocuments(filter),
  ]);
  const results = await candidatesToJSON(items);
  return res.json(drfResponse(results, total, page, pageSize));
}

async function detail(req, res) {
  const candidate = await Candidate.findOne({
    id: parseInt(req.params.pk, 10),
    isDeleted: false,
  });
  if (!candidate) return res.status(404).json({ detail: 'Not found.' });
  const json = await candidateToJSON(candidate);
  const [statusHistory, remarkHistory] = await Promise.all([
    CandidateStatusHistory.find({ candidateId: candidate.id }).sort({ changedAt: -1 }).limit(50),
    CandidateRemarkHistory.find({ candidateId: candidate.id }).sort({ createdAt: -1 }).limit(50),
  ]);
  return res.json({
    ...json,
   status_history: await Promise.all(statusHistory.map(async (h) => {
  const changedBy = h.changedById
    ? await User.findOne({ id: h.changedById })
    : null;

  return {
    id: h.id,
    old_status: h.oldStatus,
    new_status: h.newStatus,
    sub_status: h.subStatus,
    changed_at: h.changedAt,
    changed_by_name: changedBy
      ? (changedBy.fullName || changedBy.name || changedBy.username || changedBy.email)
      : 'Unknown',
  };
})),
  remark_history: await Promise.all(remarkHistory.map(async (h) => {
  const addedBy = h.addedById
    ? await User.findOne({ id: h.addedById })
    : null;

  return {
    id: h.id,
    remark: h.remark,
    created_at: h.createdAt,
    added_by_name: addedBy
      ? (addedBy.fullName || addedBy.name || addedBy.username || addedBy.email)
      : 'Unknown',
  };
})),
  });
}

async function softDelete(req, res) {
  const candidate = await Candidate.findOne({ id: parseInt(req.params.pk, 10), isDeleted: false });
  if (!candidate) return res.status(404).json({ detail: 'Not found.' });
  if (req.user.role !== 'SUB_ADMIN' && candidate.createdById !== req.user.id) {
    return res.status(403).json({ detail: 'Forbidden' });
  }
  candidate.isDeleted = true;
  candidate.changedById = req.user.id;
  await candidate.save();
  return res.json({ message: 'Candidate soft deleted successfully' });
}

async function parseResume(req, res) {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Resume file required' });
  try {
    const parsed = await parseResumeFile(file.path, file.originalname);
    return res.json({
      success: true,
      message: 'Resume parsed successfully',
      data: parsed,
    });
  } catch (e) {
    console.error('Resume parse error:', e);
    return res.status(400).json({
      success: false,
      error: 'Could not parse resume',
      detail: e.message,
    });
  }
}

async function submittedProfiles(req, res) {
  const { page, pageSize, skip, limit } = drfPaginate(req.query);
  const filter = {
    isDeleted: false,
    verificationStatus: true,
    clientId: { $ne: null },
    $or: [{ createdById: req.user.id }, { submittedToId: req.user.id }],
  };
  const [items, total] = await Promise.all([
    Candidate.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Candidate.countDocuments(filter),
  ]);
  const results = await candidatesToJSON(items);
  return res.json(drfResponse(results, total, page, pageSize));
}

async function listTimesheets(req, res) {
  const items = await TimeSheet.find({ candidateId: parseInt(req.params.candidate_id, 10) });
  return res.json(
    items.map((t) => ({
      id: t.id,
      month: t.month,
      total_working_days: t.totalWorkingDays,
      working_days: t.workingDays,
      leave_days: t.leaveDays,
      file: mediaUrl(t.file),
      uploaded_at: t.uploadedAt,
    }))
  );
}

async function createTimesheet(req, res) {
  const file = req.file;
  const t = await TimeSheet.create({
    candidateId: parseInt(req.params.candidate_id, 10),
    month: req.body.month ? new Date(req.body.month) : new Date(),
    totalWorkingDays: parseFloat(req.body.total_working_days || 0),
    workingDays: parseFloat(req.body.working_days || 0),
    file: file ? relPath(file.path) : null,
    uploadedById: req.user.id,
  });
  return res.status(201).json({ id: t.id, file: mediaUrl(t.file) });
}

async function deleteTimesheet(req, res) {
  await TimeSheet.deleteOne({ id: parseInt(req.params.pk, 10) });
  return res.status(204).send();
}

async function listVendorInvoices(req, res) {
  const items = await VendorInvoice.find({ candidateId: parseInt(req.params.candidate_id, 10) });
  return res.json(
    items.map((v) => ({
      id: v.id,
      month: v.month,
      total_amount_with_gst: v.totalAmountWithGst,
      gst_rate: v.gstRate,
      total_amount_without_gst: v.totalAmountWithoutGst,
      file: mediaUrl(v.file),
    }))
  );
}

async function createVendorInvoice(req, res) {
  const file = req.file;
  const v = await VendorInvoice.create({
    candidateId: parseInt(req.params.candidate_id, 10),
    month: req.body.month ? new Date(req.body.month) : new Date(),
    totalAmountWithGst: parseFloat(req.body.total_amount_with_gst || 0),
    gstRate: parseFloat(req.body.gst_rate || 0),
    file: file ? relPath(file.path) : null,
    uploadedById: req.user.id,
  });
  return res.status(201).json({ id: v.id });
}

async function deleteVendorInvoice(req, res) {
  await VendorInvoice.deleteOne({ id: parseInt(req.params.pk, 10) });
  return res.status(204).send();
}

async function clientInvoices(req, res) {
  const candidateId = parseInt(req.params.candidate_id, 10);
  const allInvoices = await Invoice.find({ isDeleted: false });
  const items = allInvoices.filter(i => {
    if (i.candidateId === candidateId) return true;
    if (Array.isArray(i.items)) {
      return i.items.some(item => parseInt(item.candidate, 10) === candidateId);
    }
    return false;
  });

  return res.json(
    items.map((i) => ({
      id: i.id,
      invoice_number: i.invoiceNumber,
      total_amount: i.totalAmount,
      amount: i.totalAmount,
      invoice_date: i.invoiceDate || i.createdAt,
      status: i.status,
      payment_status: i.paymentStatus,
      pdf_file: mediaUrl(i.pdfFile),
    }))
  );
}

module.exports = {
  create,
  update,
  list,
  listUser,
  detail,
  softDelete,
  parseResume,
  submittedProfiles,
  listTimesheets,
  createTimesheet,
  deleteTimesheet,
  listVendorInvoices,
  createVendorInvoice,
  deleteVendorInvoice,
  clientInvoices,
};
