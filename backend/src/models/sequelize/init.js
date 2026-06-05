const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');
const { getNextSequence } = require('../../utils/sequence');

function assignNumericId(counterName) {
  return async (instance) => {
    if (!instance.id) {
      instance.id = await getNextSequence(counterName);
    }
  };
}

const Counter = sequelize.define(
  'Counter',
  {
    name: { type: DataTypes.STRING, primaryKey: true },
    seq: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: 'counters', timestamps: false }
);

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    number: { type: DataTypes.STRING, defaultValue: '' },
    role: {
      type: DataTypes.ENUM('CENTRAL_ADMIN', 'SUB_ADMIN', 'EMPLOYEE', 'ACCOUNTANT'),
      defaultValue: 'EMPLOYEE',
    },
    profilePicture: { type: DataTypes.STRING, allowNull: true },
    parentUserId: { type: DataTypes.INTEGER, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    attendanceStreak: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastAttendanceDate: { type: DataTypes.DATE, allowNull: true },
    lateWarningCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: 'users' }
);
User.beforeCreate(assignNumericId('users'));

const Vendor = sequelize.define(
  'Vendor',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    number: { type: DataTypes.STRING, allowNull: false },
    companyName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING },
    companyWebsite: { type: DataTypes.STRING },
    companyPanOrRegNo: { type: DataTypes.STRING },
    poc1Name: { type: DataTypes.STRING },
    poc1Number: { type: DataTypes.STRING },
    poc2Name: { type: DataTypes.STRING },
    poc2Number: { type: DataTypes.STRING },
    top3Clients: { type: DataTypes.TEXT },
    noOfBenchDevelopers: { type: DataTypes.INTEGER },
    provideOnsite: { type: DataTypes.BOOLEAN, defaultValue: false },
    onsiteLocation: { type: DataTypes.STRING },
    specializedTechDevelopers: { type: DataTypes.TEXT },
    benchList: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    ndaDocument: { type: DataTypes.STRING },
    ndaUploadedDate: { type: DataTypes.DATE },
    msaDocument: { type: DataTypes.STRING },
    msaUploadedDate: { type: DataTypes.DATE },
    ndaStatus: { type: DataTypes.STRING, defaultValue: 'NOT_SENT' },
    msaStatus: { type: DataTypes.STRING, defaultValue: 'NOT_SENT' },
    vendorOfficialEmail: { type: DataTypes.STRING },
    sendingEmailId: { type: DataTypes.STRING },
    provideBench: { type: DataTypes.BOOLEAN, defaultValue: false },
    provideMarket: { type: DataTypes.BOOLEAN, defaultValue: false },
    companyEmployeeCount: { type: DataTypes.INTEGER },
    remark: { type: DataTypes.TEXT },
    uploadedById: { type: DataTypes.INTEGER },
    createdById: { type: DataTypes.INTEGER },
    assignedEmployeeIds: { type: DataTypes.JSONB, defaultValue: [] },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'vendors' }
);
Vendor.beforeCreate(assignNumericId('vendors'));

const Client = sequelize.define(
  'Client',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    clientName: { type: DataTypes.STRING, allowNull: false },
    companyName: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    ndaDocument: { type: DataTypes.STRING },
    ndaUploadedDate: { type: DataTypes.DATE },
    msaDocument: { type: DataTypes.STRING },
    msaUploadedDate: { type: DataTypes.DATE },
    ndaStatus: { type: DataTypes.STRING, defaultValue: 'NOT_SENT' },
    msaStatus: { type: DataTypes.STRING, defaultValue: 'NOT_SENT' },
    officialEmail: { type: DataTypes.STRING },
    sendingEmailId: { type: DataTypes.STRING },
    companyEmployeeCount: { type: DataTypes.INTEGER },
    remark: { type: DataTypes.TEXT },
    createdById: { type: DataTypes.INTEGER },
    assignedEmployeeIds: { type: DataTypes.JSONB, defaultValue: [] },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    gstNumber: { type: DataTypes.STRING },
    billingAddress: { type: DataTypes.TEXT },
    accountHolderName: { type: DataTypes.STRING },
    bankName: { type: DataTypes.STRING },
    accountNumber: { type: DataTypes.STRING },
    ifscCode: { type: DataTypes.STRING },
  },
  { tableName: 'clients' }
);
Client.beforeCreate(assignNumericId('clients'));

const Candidate = sequelize.define(
  'Candidate',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    resume: { type: DataTypes.STRING },
    candidateName: { type: DataTypes.STRING, allowNull: false },
    candidateEmail: { type: DataTypes.STRING },
    candidateNumber: { type: DataTypes.STRING },
    yearsOfExperienceManual: { type: DataTypes.STRING },
    yearsOfExperienceCalculated: { type: DataTypes.FLOAT },
    skills: { type: DataTypes.TEXT },
    technology: { type: DataTypes.STRING },
    vendorId: { type: DataTypes.INTEGER },
    vendorRate: { type: DataTypes.FLOAT },
    vendorRateType: { type: DataTypes.STRING },
    clientId: { type: DataTypes.INTEGER },
    clientRate: { type: DataTypes.FLOAT },
    clientRateType: { type: DataTypes.STRING },
    submittedToId: { type: DataTypes.INTEGER },
    mainStatus: { type: DataTypes.STRING, defaultValue: 'SUBMITTED' },
    subStatus: { type: DataTypes.STRING, defaultValue: 'NONE' },
    verificationStatus: { type: DataTypes.BOOLEAN, defaultValue: false },
    isBlocklisted: { type: DataTypes.BOOLEAN, defaultValue: false },
    blocklistedReason: { type: DataTypes.TEXT },
    remark: { type: DataTypes.TEXT },
    extraDetails: { type: DataTypes.TEXT },
    changedById: { type: DataTypes.INTEGER },
    createdById: { type: DataTypes.INTEGER },
    companyId: { type: DataTypes.INTEGER },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    scheduledDatetime: { type: DataTypes.DATE },
    scheduleDescription: { type: DataTypes.TEXT },
    googleEventId: { type: DataTypes.STRING },
    scheduledById: { type: DataTypes.INTEGER },
    billingStartDate: { type: DataTypes.DATE },
    billingEndDate: { type: DataTypes.DATE },
    defaultBillingRate: { type: DataTypes.FLOAT },
    defaultBillingRateType: { type: DataTypes.STRING },
  },
  { tableName: 'candidates', updatedAt: false }
);
Candidate.beforeCreate(assignNumericId('candidates'));

const CandidateStatusHistory = sequelize.define(
  'CandidateStatusHistory',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    oldStatus: { type: DataTypes.STRING },
    newStatus: { type: DataTypes.STRING },
    subStatus: { type: DataTypes.STRING },
    changedById: { type: DataTypes.INTEGER },
    changedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: 'candidate_status_history', timestamps: false }
);
CandidateStatusHistory.beforeCreate(assignNumericId('candidateStatusHistory'));

const CandidateRemarkHistory = sequelize.define(
  'CandidateRemarkHistory',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    remark: { type: DataTypes.TEXT },
    addedById: { type: DataTypes.INTEGER },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: 'candidate_remark_history', timestamps: false }
);
CandidateRemarkHistory.beforeCreate(assignNumericId('candidateRemarkHistory'));

const RequirementIDCounter = sequelize.define(
  'RequirementIDCounter',
  {
    month: { type: DataTypes.STRING, allowNull: false },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    lastSequence: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: 'requirement_id_counters',
    timestamps: false,
    indexes: [{ unique: true, fields: ['month', 'company_id'] }],
  }
);

const Requirement = sequelize.define(
  'Requirement',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    clientId: { type: DataTypes.INTEGER, allowNull: false },
    experienceRequired: { type: DataTypes.STRING },
    rate: { type: DataTypes.STRING },
    timeZone: { type: DataTypes.STRING },
    vendorBudgetRange: { type: DataTypes.STRING },
    jdDescription: { type: DataTypes.TEXT },
    skills: { type: DataTypes.TEXT },
    requirementId: { type: DataTypes.STRING, unique: true },
    companyId: { type: DataTypes.INTEGER },
    createdById: { type: DataTypes.INTEGER },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    manualStatus: { type: DataTypes.STRING },
    manualStatusUpdatedAt: { type: DataTypes.DATE },
  },
  { tableName: 'requirements' }
);
Requirement.beforeCreate(assignNumericId('requirements'));

async function generateRequirementId(companyId) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const monthKey = `${yy}${mm}`;

  const [counter] = await RequirementIDCounter.findOrCreate({
    where: { month: monthKey, companyId },
    defaults: { lastSequence: 0 },
  });

  counter.lastSequence += 1;
  await counter.save();

  const seq = String(counter.lastSequence).padStart(3, '0');
  return `REQ-${monthKey}-${seq}`;
}

const RequirementAssignment = sequelize.define(
  'RequirementAssignment',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    requirementId: { type: DataTypes.INTEGER, allowNull: false },
    assignedToId: { type: DataTypes.INTEGER, allowNull: false },
    assignedById: { type: DataTypes.INTEGER },
    companyId: { type: DataTypes.INTEGER },
  },
  {
    tableName: 'requirement_assignments',
    indexes: [{ unique: true, fields: ['requirement_id', 'assigned_to_id'] }],
  }
);
RequirementAssignment.beforeCreate(assignNumericId('requirementAssignments'));

const CandidateJDSubmission = sequelize.define(
  'CandidateJDSubmission',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    requirementId: { type: DataTypes.INTEGER, allowNull: false },
    submittedById: { type: DataTypes.INTEGER },
    companyId: { type: DataTypes.INTEGER },
  },
  {
    tableName: 'candidate_jd_submissions',
    indexes: [{ unique: true, fields: ['candidate_id', 'requirement_id'] }],
  }
);
CandidateJDSubmission.beforeCreate(assignNumericId('jdSubmissions'));

const TimeSheet = sequelize.define(
  'TimeSheet',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.DATE },
    totalWorkingDays: { type: DataTypes.INTEGER, defaultValue: 0 },
    workingDays: { type: DataTypes.INTEGER, defaultValue: 0 },
    leaveDays: { type: DataTypes.INTEGER, defaultValue: 0 },
    file: { type: DataTypes.STRING },
    uploadedById: { type: DataTypes.INTEGER },
    uploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: 'timesheets', timestamps: false }
);
TimeSheet.beforeCreate(async (instance) => {
  if (!instance.id) instance.id = await getNextSequence('timesheets');
  instance.leaveDays = (instance.totalWorkingDays || 0) - (instance.workingDays || 0);
});

const VendorInvoice = sequelize.define(
  'VendorInvoice',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.DATE },
    totalAmountWithGst: { type: DataTypes.FLOAT, defaultValue: 0 },
    gstRate: { type: DataTypes.FLOAT, defaultValue: 0 },
    totalAmountWithoutGst: { type: DataTypes.FLOAT, defaultValue: 0 },
    file: { type: DataTypes.STRING },
    uploadedById: { type: DataTypes.INTEGER },
    uploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: 'vendor_invoices', timestamps: false }
);
VendorInvoice.beforeCreate(async (instance) => {
  if (!instance.id) instance.id = await getNextSequence('vendorInvoices');
  if (instance.totalAmountWithGst && instance.gstRate) {
    instance.totalAmountWithoutGst =
      instance.totalAmountWithGst / (1 + instance.gstRate / 100);
  }
});

const CompanyFinanceSettings = sequelize.define(
  'CompanyFinanceSettings',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    companyName: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    gstin: { type: DataTypes.STRING },
    logo: { type: DataTypes.STRING },
    signature: { type: DataTypes.STRING },
    defaultGstRate: { type: DataTypes.FLOAT, defaultValue: 18 },
    defaultSacCode: { type: DataTypes.STRING },
    defaultTerms: { type: DataTypes.TEXT },
    createdById: { type: DataTypes.INTEGER },
  },
  { tableName: 'company_finance_settings' }
);
CompanyFinanceSettings.beforeCreate(assignNumericId('companyFinanceSettings'));

const CompanyBankAccount = sequelize.define(
  'CompanyBankAccount',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    companyOwnerId: { type: DataTypes.INTEGER },
    accountHolderName: { type: DataTypes.STRING },
    bankName: { type: DataTypes.STRING },
    accountNumber: { type: DataTypes.STRING },
    ifscCode: { type: DataTypes.STRING },
    branch: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'company_bank_accounts' }
);
CompanyBankAccount.beforeCreate(assignNumericId('companyBankAccounts'));

const Invoice = sequelize.define(
  'Invoice',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    invoiceType: { type: DataTypes.ENUM('CANDIDATE', 'CUSTOM'), allowNull: false },
    billingType: { type: DataTypes.STRING, defaultValue: 'MANUAL' },
    invoiceNumber: { type: DataTypes.STRING, unique: true },
    candidateId: { type: DataTypes.INTEGER },
    clientId: { type: DataTypes.INTEGER },
    vendorId: { type: DataTypes.INTEGER },
    companyBankAccountId: { type: DataTypes.INTEGER },
    createdById: { type: DataTypes.INTEGER },
    companyId: { type: DataTypes.INTEGER },
    billToName: { type: DataTypes.STRING },
    billToAddress: { type: DataTypes.TEXT },
    billToGst: { type: DataTypes.STRING },
    invoiceDate: { type: DataTypes.DATE },
    dueDate: { type: DataTypes.DATE },
    subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
    gstRate: { type: DataTypes.FLOAT, defaultValue: 18 },
    gstAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    totalAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'DRAFT' },
    paymentStatus: { type: DataTypes.STRING, defaultValue: 'UNPAID' },
    tds: { type: DataTypes.FLOAT, defaultValue: 0 },
    vendorCost: { type: DataTypes.FLOAT, defaultValue: 0 },
    margin: { type: DataTypes.FLOAT, defaultValue: 0 },
    tdsAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    items: { type: DataTypes.JSONB, defaultValue: [] },
    timesheetFile: { type: DataTypes.STRING },
    clientSowFile: { type: DataTypes.STRING },
    vendorSowFile: { type: DataTypes.STRING },
    pdfFile: { type: DataTypes.STRING },
    externalInvoiceFile: { type: DataTypes.STRING },
    notes: { type: DataTypes.TEXT },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'invoices' }
);
Invoice.beforeCreate(assignNumericId('invoices'));

const InvoicePayment = sequelize.define(
  'InvoicePayment',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    invoiceId: { type: DataTypes.INTEGER },
    amount: { type: DataTypes.FLOAT },
    paymentDate: { type: DataTypes.DATE },
    paymentMode: { type: DataTypes.STRING },
    referenceNumber: { type: DataTypes.STRING },
    notes: { type: DataTypes.TEXT },
    recordedById: { type: DataTypes.INTEGER },
  },
  { tableName: 'invoice_payments' }
);
InvoicePayment.beforeCreate(assignNumericId('invoicePayments'));

const CompanySettings = sequelize.define(
  'CompanySettings',
  {
    companyId: { type: DataTypes.INTEGER, primaryKey: true, unique: true },
    officeStartTime: { type: DataTypes.STRING, defaultValue: '10:00:00' },
    lateThresholdMinutes: { type: DataTypes.INTEGER, defaultValue: 15 },
    officeEndTime: { type: DataTypes.STRING, defaultValue: '19:00:00' },
    defaultSourcingTarget: { type: DataTypes.INTEGER, defaultValue: 5 },
    defaultSubmissionTarget: { type: DataTypes.INTEGER, defaultValue: 2 },
    pointsOnTime: { type: DataTypes.INTEGER, defaultValue: 1 },
    pointsLate: { type: DataTypes.INTEGER, defaultValue: -2 },
    pointsAbsent: { type: DataTypes.INTEGER, defaultValue: -5 },
    allowHomeCheckin: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'company_settings' }
);

const Attendance = sequelize.define(
  'Attendance',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    checkIn: { type: DataTypes.DATE },
    checkOut: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING, defaultValue: 'ABSENT' },
    workFrom: { type: DataTypes.STRING, defaultValue: 'OFFICE' },
    lateReason: { type: DataTypes.TEXT },
    location: { type: DataTypes.STRING },
    companyId: { type: DataTypes.INTEGER },
  },
  {
    tableName: 'attendance',
    indexes: [{ unique: true, fields: ['user_id', 'date'] }],
  }
);
Attendance.beforeCreate(assignNumericId('attendance'));

const DailyWorkReport = sequelize.define(
  'DailyWorkReport',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    userId: { type: DataTypes.INTEGER },
    date: { type: DataTypes.DATE },
    workDone: { type: DataTypes.TEXT },
    challenges: { type: DataTypes.TEXT },
    planForTomorrow: { type: DataTypes.TEXT },
    companyId: { type: DataTypes.INTEGER },
  },
  {
    tableName: 'daily_work_reports',
    indexes: [{ unique: true, fields: ['user_id', 'date'] }],
  }
);
DailyWorkReport.beforeCreate(assignNumericId('dailyWorkReports'));

const GoogleCalendarAccount = sequelize.define(
  'GoogleCalendarAccount',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    accessToken: { type: DataTypes.TEXT, allowNull: false },
    refreshToken: { type: DataTypes.TEXT },
    tokenExpiry: { type: DataTypes.DATE, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'calendar_service_googlecalendaraccount' }
);

const CandidateCalendarEvent = sequelize.define(
  'CandidateCalendarEvent',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    candidateId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    googleEventId: { type: DataTypes.STRING, allowNull: false },
    eventTitle: { type: DataTypes.STRING, allowNull: false },
    eventDescription: { type: DataTypes.TEXT },
    startDatetime: { type: DataTypes.DATE, allowNull: false },
    endDatetime: { type: DataTypes.DATE, allowNull: false },
    timezone: { type: DataTypes.STRING, defaultValue: 'Asia/Kolkata' },
    createdById: { type: DataTypes.INTEGER },
    updatedById: { type: DataTypes.INTEGER },
    isCancelled: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'calendar_service_candidatecalendarevent' }
);

const CandidateCalendarEventHistory = sequelize.define(
  'CandidateCalendarEventHistory',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    eventId: { type: DataTypes.BIGINT, allowNull: false },
    actionType: { type: DataTypes.STRING, allowNull: false },
    previousTitle: { type: DataTypes.STRING },
    previousDescription: { type: DataTypes.TEXT },
    previousStartDatetime: { type: DataTypes.DATE },
    previousEndDatetime: { type: DataTypes.DATE },
    newTitle: { type: DataTypes.STRING },
    newDescription: { type: DataTypes.TEXT },
    newStartDatetime: { type: DataTypes.DATE },
    newEndDatetime: { type: DataTypes.DATE },
    changedById: { type: DataTypes.INTEGER },
    changeReason: { type: DataTypes.TEXT },
  },
  {
    tableName: 'calendar_service_candidatecalendareventhistory',
    updatedAt: false,
  }
);

async function syncDatabase() {
  await sequelize.sync();
}

module.exports = {
  sequelize,
  Counter,
  User,
  Vendor,
  Client,
  Candidate,
  CandidateStatusHistory,
  CandidateRemarkHistory,
  Requirement,
  RequirementIDCounter,
  generateRequirementId,
  RequirementAssignment,
  CandidateJDSubmission,
  TimeSheet,
  VendorInvoice,
  CompanyFinanceSettings,
  CompanyBankAccount,
  Invoice,
  InvoicePayment,
  CompanySettings,
  Attendance,
  DailyWorkReport,
  GoogleCalendarAccount,
  CandidateCalendarEvent,
  CandidateCalendarEventHistory,
  syncDatabase,
};
