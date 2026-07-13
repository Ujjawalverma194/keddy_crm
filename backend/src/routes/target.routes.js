const express = require('express');
const { authenticate, requireRoles } = require('../middleware/auth');
const targetController = require('../controllers/targetController');

const router = express.Router();

router.use(authenticate);

// Admin & TL routes
router.post('/api/targets/assign', requireRoles('CENTRAL_ADMIN', 'SUB_ADMIN', 'EMPLOYEE'), targetController.assignTarget);
router.put('/api/targets/:id', requireRoles('CENTRAL_ADMIN', 'SUB_ADMIN', 'EMPLOYEE'), targetController.updateTarget);
router.delete('/api/targets/:id', requireRoles('CENTRAL_ADMIN', 'SUB_ADMIN', 'EMPLOYEE'), targetController.deleteTarget);
router.get('/api/targets/team', requireRoles('CENTRAL_ADMIN', 'SUB_ADMIN', 'EMPLOYEE'), targetController.getTeamTargets);

// Employee routes
router.get('/api/targets/my-targets', targetController.getMyTargets);

// Shared
router.get('/api/targets/history', targetController.getTargetHistory);

module.exports = router;
