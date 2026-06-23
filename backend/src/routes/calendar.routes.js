const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/calendarController');

const router = express.Router();

async function authOrSession(req, res, next) {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  const user = await ctrl.resolveReqUser(req);
  if (!user) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided.' });
  }
  req.user = user;
  return next();
}

router.get('/google/connect/', authOrSession, ctrl.googleConnect);
router.get('/google/callback/', authOrSession, ctrl.googleCallback);
router.get('/google/test/', authenticate, ctrl.testGoogleApi);
router.post('/google/create-event/', authenticate, ctrl.createCandidateEvent);
router.get('/google/event-history/:candidate_id/', authenticate, ctrl.candidateEventHistory);

module.exports = router;
