const express = require('express');
const landing = require('../controllers/landingController');

const router = express.Router();

router.post('/api/register/', landing.register);
router.post('/api/login/', landing.login);
router.post('/api/logout/', require('../middleware/auth').authenticate, landing.logout);

module.exports = router;
