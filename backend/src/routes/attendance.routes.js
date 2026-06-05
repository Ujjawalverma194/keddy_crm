const express = require('express');
const { authenticate, requireRoles } = require('../middleware/auth');
const ctrl = require('../controllers/attendanceController');

const router = express.Router();

router.post('/check-in/', authenticate, requireRoles('EMPLOYEE'), ctrl.checkIn);
router.post('/check-out/', authenticate, requireRoles('EMPLOYEE'), ctrl.checkOut);
router.post('/daily-report/', authenticate, requireRoles('EMPLOYEE'), ctrl.dailyReport);
router.get('/my-today/', authenticate, requireRoles('EMPLOYEE'), ctrl.myToday);
router.get('/my-monthly/', authenticate, requireRoles('EMPLOYEE'), ctrl.myMonthly);
router.get('/attendance-board/', authenticate, ctrl.attendanceBoard);

router.get('/admin/users/', authenticate, requireRoles('SUB_ADMIN'), ctrl.adminUsers);
router.get('/admin/users/:id/', authenticate, requireRoles('SUB_ADMIN'), ctrl.adminUserDetail);
router.get('/admin/attendance/', authenticate, requireRoles('SUB_ADMIN'), ctrl.adminAttendanceList);
router.get('/admin/attendance/:id/', authenticate, requireRoles('SUB_ADMIN'), ctrl.adminAttendanceDetail);
router.put('/admin/attendance/:id/', authenticate, requireRoles('SUB_ADMIN'), ctrl.adminAttendanceUpdate);
router.delete('/admin/attendance/:id/delete/', authenticate, requireRoles('SUB_ADMIN'), ctrl.adminAttendanceDelete);
router.get('/admin/reports/', authenticate, requireRoles('SUB_ADMIN'), ctrl.adminReports);
router.delete('/admin/reports/:id/delete/', authenticate, requireRoles('SUB_ADMIN'), ctrl.adminReportDelete);

module.exports = router;
