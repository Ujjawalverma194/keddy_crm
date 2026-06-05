const express = require('express');
const { authenticate, requireRoles } = require('../middleware/auth');
const { uploadProfile } = require('../middleware/upload');
const ctrl = require('../controllers/subAdminController');

const router = express.Router();
router.use(authenticate);
router.use(requireRoles('SUB_ADMIN', 'EMPLOYEE'));

router.get('/api/subadmin/dashboard/stats/', ctrl.dashboardStats);
router.get('/api/subadmin/dashboard/today-verified/', ctrl.todayVerified);
router.get('/api/subadmin/dashboard/pipeline/', ctrl.pipeline);
router.get('/api/dashboard/today-profiles/', ctrl.todayProfiles);
router.get('/api/last-7-days-verified/', ctrl.last7Verified);

router.get('/api/users/', ctrl.listUsers);
router.post('/api/users/', uploadProfile.single('profile_picture'), ctrl.createUser);
router.get('/api/users/:pk/', ctrl.getUser);
router.patch('/api/users/:pk/', ctrl.updateUser);
router.delete('/api/users/:user_id/soft-delete/', ctrl.softDeleteUser);
router.delete('/api/users/:user_id/hard-delete/', ctrl.hardDeleteUser);
router.patch('/api/users/:user_id/restore/', ctrl.restoreUser);

router.get('/api/clients/', ctrl.listClients);
router.post('/api/clients/assign/', ctrl.assignClient);
router.post('/api/clients/revoke/', ctrl.revokeClient);
router.delete('/api/clients/:client_id/soft-delete/', ctrl.clientSoftDelete);
router.post('/api/clients/:client_id/restore/', ctrl.clientRestore);
router.delete('/api/clients/:client_id/hard-delete/', ctrl.clientHardDelete);

router.get('/api/admin-vendors/', ctrl.listVendors);
router.post('/api/vendors/assign/', ctrl.assignVendor);
router.delete('/api/vendors/:vendor_id/soft-delete/', ctrl.vendorSoftDelete);
router.post('/api/vendors/:vendor_id/restore/', ctrl.vendorRestore);
router.delete('/api/vendors/:vendor_id/hard-delete/', ctrl.vendorHardDelete);

router.get('/api/admin-candidates/', ctrl.listCandidates);
router.get('/api/candidates/submitted/', ctrl.submitted);
router.get('/api/candidates/onboard/', ctrl.onboard);
router.get('/api/candidates/offboarded/', ctrl.offboarded);

router.delete('/candidates/:pk/soft-delete/', ctrl.candidateSoftDelete);
router.patch('/candidates/:pk/restore/', ctrl.candidateRestore);
router.delete('/candidates/:pk/hard-delete/', ctrl.candidateHardDelete);
router.delete('/candidates/:candidate_id/remove-from-offboarded/', ctrl.removeFromOffboarded);

module.exports = router;
