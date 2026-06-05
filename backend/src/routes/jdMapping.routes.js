const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/jdMappingController');

const router = express.Router();
router.use(authenticate);

router.post('/api/requirements/', ctrl.create);
router.get('/api/requirements/list/', ctrl.list);
router.get('/api/requirements/:pk/', ctrl.detail);
router.put('/api/requirements/:pk/update/', ctrl.update);
router.patch('/api/requirements/:pk/update/', ctrl.update);
router.delete('/api/requirements/:pk/delete/', ctrl.softDelete);

router.post('/api/assignments/create/', ctrl.createAssignment);
router.post('/api/submissions/create/', ctrl.createSubmission);

router.get('/my-jds/', ctrl.myJds);
router.get('/company-jds/', ctrl.companyJds);
router.put('/requirements/:pk/update-status/', ctrl.updateStatus);
router.get('/company-available-requirements/', ctrl.companyAvailable);

module.exports = router;
