const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Client = require('../models/Client');
const { mediaUrl } = require('./serialize');

function fkId(obj, camel, snake) {
  const v = obj?.[camel] ?? obj?.[snake];
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function boolField(obj, camel, snake) {
  const v = obj?.[camel] ?? obj?.[snake];
  return v === true || v === 1 || v === 'true' || v === '1';
}

async function getUserMap(ids) {
  const unique = [...new Set(ids.map((id) => fkId({ x: id }, 'x', 'x')).filter(Boolean))];
  if (!unique.length) return new Map();
  const users = await User.find({ id: { $in: unique } });
  return new Map(users.map((u) => [Number(u.id), u]));
}

function vendorToJSON(v, userMap = new Map()) {
  const uploadedBy = userMap.get(fkId(v, 'uploadedById', 'uploaded_by_id'));
  const createdBy = userMap.get(fkId(v, 'createdById', 'created_by_id'));
  return {
    id: v.id,
    name: v.name,
    number: v.number,
    company_name: v.companyName,
    email: v.email,
    company_website: v.companyWebsite,
    company_pan_or_reg_no: v.companyPanOrRegNo,
    poc1_name: v.poc1Name,
    poc1_number: v.poc1Number,
    poc2_name: v.poc2Name,
    poc2_number: v.poc2Number,
    top_3_clients: v.top3Clients,
    no_of_bench_developers: v.noOfBenchDevelopers,
    provide_onsite: v.provideOnsite,
    onsite_location: v.onsiteLocation,
    specialized_tech_developers: v.specializedTechDevelopers,
    bench_list: mediaUrl(v.benchList),
    nda_document: mediaUrl(v.ndaDocument),
    msa_document: mediaUrl(v.msaDocument),
    nda_status: v.ndaStatus,
    msa_status: v.msaStatus,
    is_verified: v.isVerified,
    is_active: v.isActive,
    uploaded_by: uploadedBy ? { id: uploadedBy.id, email: uploadedBy.email, role: uploadedBy.role } : null,
    created_by: createdBy ? { id: createdBy.id, email: createdBy.email } : null,
    created_by_name: userDisplayName(createdBy),
    created_by_email: createdBy?.email || null,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  };
}

function userDisplayName(user) {
  if (!user) return null;
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email || null;
}

function lookupUser(userMap, id) {
  if (id == null || !userMap) return null;
  return userMap.get(Number(id)) || null;
}

/** Resolve creator display name (handles deleted creator FK via company owner). */
function resolveCreatedByName(candidate, createdBy, userMap) {
  if (createdBy) return userDisplayName(createdBy);
  const companyId = fkId(candidate, 'companyId', 'company_id');
  if (companyId) return userDisplayName(lookupUser(userMap, companyId));
  return null;
}

/**
 * Resolve "Submitted To" for dashboard/lists.
 * Uses submitter FK when valid; otherwise company sub-admin or employee's parent (typical submit target).
 */
function resolveSubmittedToName(candidate, createdBy, submittedTo, userMap) {
  const submittedToId = fkId(candidate, 'submittedToId', 'submitted_to_id');
  const createdById = fkId(candidate, 'createdById', 'created_by_id');
  const clientId = fkId(candidate, 'clientId', 'client_id');
  const companyId = fkId(candidate, 'companyId', 'company_id');
  const verified = boolField(candidate, 'verificationStatus', 'verification_status');

  const submitter = submittedTo || lookupUser(userMap, submittedToId);
  if (submitter) return userDisplayName(submitter);

  // Stale/missing submitter user id → company sub-admin
  if (companyId) {
    const owner = lookupUser(userMap, companyId);
    if (owner) return userDisplayName(owner);
  }

  // Client submission without submitter stored → reporting manager (sub-admin)
  if (clientId && createdBy) {
    const parentId = fkId(createdBy, 'parentUserId', 'parent_user_id');
    if (parentId) {
      const parent = lookupUser(userMap, parentId);
      if (parent) return userDisplayName(parent);
    }
  }

  if (submittedToId != null && createdById != null && submittedToId === createdById && createdBy) {
    return userDisplayName(createdBy);
  }

  if (verified && !clientId && createdBy) {
    return userDisplayName(createdBy);
  }

  return null;
}

function clientToJSON(c, userMap = new Map()) {
  const createdById = fkId(c, 'createdById', 'created_by_id');
  const createdBy = userMap.get(createdById) || userMap.get(c.createdById);
  return {
    id: c.id,
    client_name: c.clientName,
    company_name: c.companyName,
    phone_number: c.phoneNumber,
    email: c.email,
    is_verified: c.isVerified,
    is_active: c.isActive,
    gst_number: c.gstNumber,
    billing_address: c.billingAddress,
    nda_document: mediaUrl(c.ndaDocument),
    msa_document: mediaUrl(c.msaDocument),
    created_by: createdBy ? { id: createdBy.id, email: createdBy.email } : null,
    created_by_name: userDisplayName(createdBy),
    created_by_email: createdBy?.email || null,
    created_at: c.createdAt,
  };
}

async function candidateToJSON(c, caches = {}) {
  const vendorId = fkId(c, 'vendorId', 'vendor_id');
  const clientId = fkId(c, 'clientId', 'client_id');
  const createdById = fkId(c, 'createdById', 'created_by_id');
  const submittedToId = fkId(c, 'submittedToId', 'submitted_to_id');

  const userMap = caches.userMap;
  const vendorMap = caches.vendorMap;
  const clientMap = caches.clientMap;

  const [vendor, client, createdBy, submittedTo] = await Promise.all([
    vendorId
      ? vendorMap?.get(vendorId) || Vendor.findOne({ id: vendorId })
      : null,
    clientId
      ? clientMap?.get(clientId) || Client.findOne({ id: clientId })
      : null,
    createdById
      ? lookupUser(userMap, createdById) || User.findOne({ id: createdById })
      : null,
    submittedToId
      ? lookupUser(userMap, submittedToId) || User.findOne({ id: submittedToId })
      : null,
  ]);

  const effectiveUserMap = userMap || new Map();
  if (createdBy && createdById) effectiveUserMap.set(Number(createdById), createdBy);
  if (submittedTo && submittedToId) effectiveUserMap.set(Number(submittedToId), submittedTo);

  const submittedToName = resolveSubmittedToName(c, createdBy, submittedTo, effectiveUserMap);
  const createdByName = resolveCreatedByName(c, createdBy, effectiveUserMap);
  const submitterUser = submittedTo || lookupUser(effectiveUserMap, submittedToId);

  return {
    id: c.id,
    candidate_name: c.candidateName,
    candidate_email: c.candidateEmail,
    candidate_number: c.candidateNumber,
    years_of_experience_manual: c.yearsOfExperienceManual,
    years_of_experience_calculated: c.yearsOfExperienceCalculated,
    skills: c.skills,
    technology: c.technology,
    resume: mediaUrl(c.resume),
    vendor: vendor ? vendor.id : null,
    vendor_name: vendor?.name,
    vendor_company_name: vendor?.companyName,
    vendor_number: vendor?.number,
    client: client ? client.id : null,
    client_name: client?.clientName,
    client_company_name: client?.companyName,
    vendor_rate: c.vendorRate,
    vendor_rate_type: c.vendorRateType,
    client_rate: c.clientRate,
    client_rate_type: c.clientRateType,
    main_status: c.mainStatus,
    sub_status: c.subStatus,
    verification_status: c.verificationStatus,
    is_blocklisted: c.isBlocklisted,
    blocklisted_reason: c.blocklistedReason,
    remark: c.remark,
    extra_details: c.extraDetails,
    submitted_to: submitterUser ? submitterUser.id : submittedToId,
    submitted_to_name: submittedToName,
    submitted_to_details: submitterUser
      ? {
          id: submitterUser.id,
          first_name: submitterUser.firstName,
          last_name: submitterUser.lastName,
          email: submitterUser.email,
          name: submittedToName,
        }
      : submittedToName
        ? { name: submittedToName }
        : null,
    created_by: createdBy ? createdBy.id : fkId(c, 'createdById', 'created_by_id'),
    created_by_name: createdByName,
    created_at: c.createdAt,
    scheduled_datetime: c.scheduledDatetime,
    schedule_description: c.scheduleDescription,
    billing_start_date: c.billingStartDate,
    billing_end_date: c.billingEndDate,
  };
}

async function candidatesToJSON(candidates) {
  if (!candidates?.length) return [];

  const userIds = new Set();
  const vendorIds = new Set();
  const clientIds = new Set();

  for (const c of candidates) {
    const createdById = fkId(c, 'createdById', 'created_by_id');
    const submittedToId = fkId(c, 'submittedToId', 'submitted_to_id');
    const companyId = fkId(c, 'companyId', 'company_id');
    const vendorId = fkId(c, 'vendorId', 'vendor_id');
    const clientId = fkId(c, 'clientId', 'client_id');
    if (createdById) userIds.add(createdById);
    if (submittedToId) userIds.add(submittedToId);
    if (companyId) userIds.add(companyId);
    if (vendorId) vendorIds.add(vendorId);
    if (clientId) clientIds.add(clientId);
  }

  let users = userIds.size ? await User.find({ id: { $in: [...userIds] } }) : [];
  for (const u of users) {
    const parentId = fkId(u, 'parentUserId', 'parent_user_id');
    if (parentId) userIds.add(parentId);
  }

  const missingParents = [...userIds].filter((id) => !users.some((u) => Number(u.id) === Number(id)));
  if (missingParents.length) {
    const extra = await User.find({ id: { $in: missingParents } });
    users = users.concat(extra);
  }

  const [vendors, clients] = await Promise.all([
    vendorIds.size ? Vendor.find({ id: { $in: [...vendorIds] } }) : [],
    clientIds.size ? Client.find({ id: { $in: [...clientIds] } }) : [],
  ]);

  const caches = {
    userMap: new Map(users.map((u) => [Number(u.id), u])),
    vendorMap: new Map(vendors.map((v) => [Number(v.id), v])),
    clientMap: new Map(clients.map((cl) => [Number(cl.id), cl])),
  };

  return Promise.all(candidates.map((c) => candidateToJSON(c, caches)));
}

module.exports = {
  vendorToJSON,
  clientToJSON,
  candidateToJSON,
  candidatesToJSON,
  getUserMap,
  userDisplayName,
};
