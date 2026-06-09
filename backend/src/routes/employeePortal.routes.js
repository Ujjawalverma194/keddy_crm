const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  uploadVendor,
  uploadClient,
  uploadResume,
  uploadTimesheet,
  uploadVendorInvoice,
} = require("../middleware/upload");
const vendors = require("../controllers/employeePortal/vendors");
const clients = require("../controllers/employeePortal/clients");
const candidates = require("../controllers/employeePortal/candidates");
const dashboard = require("../controllers/employeePortal/dashboard");

const router = express.Router();
router.use(authenticate);

// Vendors
router.post("/api/vendors/create/", uploadVendor.any(), vendors.create);
router.put(
  "/api/vendors/:vendor_id/update/",
  uploadVendor.any(),
  vendors.update,
);
router.post("/api/vendors/:vendor_id/toggle-verify/", vendors.toggleVerify);
router.get("/api/comapany/vendors/pool/", vendors.listCompanyPool);
router.get("/api/vendors/:vendor_id/", vendors.detail);
router.delete("/api/vendors/:vendor_id/delete/", vendors.softDelete);
router.get("/api/user/vendors/", vendors.listUserVendors);

// Clients
router.post("/clients/create/", uploadClient.any(), clients.create);
router.patch(
  "/api/clients/:client_id/update/",
  uploadClient.any(),
  clients.update,
);
router.put(
  "/api/clients/:client_id/update/",
  uploadClient.any(),
  clients.update,
);
router.post("/api/clients/:client_id/toggle-verify/", clients.toggleVerify);
router.get("/clients/list/", clients.list);
router.get("/api/clients/:client_id/", clients.detail);
router.delete("/api/clients/:client_id/delete/", clients.softDelete);

router.get("/api/employees/", clients.employees);

// Candidates
// Candidates
router.post(
  "/api/candidates/parse-resume/",
  uploadResume.single("resume"),
  candidates.parseResume,
);

router.post(
  "/api/candidates/create/",
  uploadResume.single("resume"),
  candidates.create,
);

router.get("/api/candidates/list/", candidates.list);
router.get("/api/user/candidates/list/", candidates.listUser);

// UPDATE CANDIDATE + RESUME
router.put(
  "/api/candidates/:pk/update/",
  uploadResume.single("resume"),
  candidates.update,
);

router.patch(
  "/api/candidates/:pk/update/",
  uploadResume.single("resume"),
  candidates.update,
);

// DETAILS
router.get("/api/candidates/:pk/", candidates.detail);

// SUBMITTED PROFILES
router.get("/api/submitted-profiles/", candidates.submittedProfiles);

// DELETE
router.delete("/api/candidates/:pk/soft-delete/", candidates.softDelete);

// TIMESHEETS
router.get(
  "/api/candidates/:candidate_id/timesheets/",
  candidates.listTimesheets,
);

router.post(
  "/api/candidates/:candidate_id/timesheets/",
  uploadTimesheet.single("file"),
  candidates.createTimesheet,
);

router.delete("/api/timesheets/:pk/delete/", candidates.deleteTimesheet);

// VENDOR INVOICES
router.get(
  "/api/candidates/:candidate_id/vendor-invoices/",
  candidates.listVendorInvoices,
);

router.post(
  "/api/candidates/:candidate_id/vendor-invoices/",
  uploadVendorInvoice.single("file"),
  candidates.createVendorInvoice,
);

router.delete(
  "/api/vendor-invoices/:pk/delete/",
  candidates.deleteVendorInvoice,
);

// CLIENT INVOICES
router.get(
  "/api/candidates/:candidate_id/client-invoices/",
  candidates.clientInvoices,
);

// Dashboard
router.get("/dashboard/stats/", dashboard.stats);
router.get("/dashboard/today-candidates/", dashboard.todayCandidates);
router.get("/dashboard/today-verified-candidates/", dashboard.todayVerified);
router.get("/dashboard/active-pipeline-candidates/", dashboard.activePipeline);
router.get(
  "/dashboard/team/today-submissions/",
  dashboard.todayTeamSubmissions,
);
router.get("/dashboard/last-7-days-verified/", dashboard.last7DaysVerified);
router.get("/team/all-submissions/", dashboard.allTeamSubmissions);

module.exports = router;
