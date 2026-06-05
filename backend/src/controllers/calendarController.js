const User = require('../models/User');
const Candidate = require('../models/Candidate');
const {
  GoogleCalendarAccount,
  CandidateCalendarEvent,
  CandidateCalendarEventHistory,
} = require('../models/Calendar');
const {
  testGoogleConnection,
  createGoogleEvent,
} = require('../services/googleCalendarService');
const config = require('../config');

async function resolveReqUser(req) {
  if (req.user) return req.user;
  if (req.session?.userId) {
    return User.findOne({ id: req.session.userId, isActive: true, isDeleted: false });
  }
  return null;
}

function googleConnect(req, res) {
  if (!config.google.clientId || !config.google.redirectUri) {
    return res.status(500).json({ error: 'Google OAuth credentials not configured properly.' });
  }

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar',
    access_type: 'offline',
    prompt: 'consent',
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

async function googleCallback(req, res) {
  const user = await resolveReqUser(req);
  if (!user) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided.' });
  }

  const code = req.query.code;
  if (!code) return res.status(400).json({ error: 'Authorization code not received.' });

  const body = new URLSearchParams({
    code,
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret,
    redirect_uri: config.google.redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokenJson = await tokenResponse.json();

  if (!tokenJson.access_token) {
    return res.status(400).json({ error: 'Failed to retrieve access token.', details: tokenJson });
  }

  const expiresIn = tokenJson.expires_in || 3600;
  const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

  const existing = await GoogleCalendarAccount.findOne({ userId: user.id });
  const update = {
    accessToken: tokenJson.access_token,
    refreshToken: tokenJson.refresh_token || existing?.refreshToken || '',
    tokenExpiry,
    isActive: true,
  };

  if (existing) {
    Object.assign(existing, update);
    await existing.save();
  } else {
    await GoogleCalendarAccount.create({ userId: user.id, ...update });
  }

  return res.json({
    message: 'Google Calendar connected successfully.',
    email: user.email,
  });
}

async function testGoogleApi(req, res) {
  const result = await testGoogleConnection(req.user);
  if (result.error) return res.status(400).json(result);
  return res.json(result);
}

function parseDatetime(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function createCandidateEvent(req, res) {
  const {
    candidate_id,
    title,
    description,
    start_datetime,
    end_datetime,
  } = req.body || {};

  const startDt = parseDatetime(start_datetime);
  const endDt = parseDatetime(end_datetime);

  if (!candidate_id || !title || !startDt || !endDt) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const candidate = await Candidate.findOne({
    id: parseInt(candidate_id, 10),
    isDeleted: false,
  });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  const googleResponse = await createGoogleEvent(
    req.user,
    title,
    description,
    startDt,
    endDt
  );

  if (googleResponse.error) return res.status(400).json(googleResponse);

  const googleEventId = googleResponse.id;
  let event = await CandidateCalendarEvent.findOne({ candidateId: candidate.id });
  const created = !event;

  if (event) {
    event.googleEventId = googleEventId;
    event.eventTitle = title;
    event.eventDescription = description;
    event.startDatetime = startDt;
    event.endDatetime = endDt;
    event.updatedById = req.user.id;
    event.isCancelled = false;
    await event.save();
  } else {
    event = await CandidateCalendarEvent.create({
      candidateId: candidate.id,
      googleEventId,
      eventTitle: title,
      eventDescription: description,
      startDatetime: startDt,
      endDatetime: endDt,
      createdById: req.user.id,
      updatedById: req.user.id,
      isCancelled: false,
    });
  }

  await CandidateCalendarEventHistory.create({
    eventId: event.id,
    actionType: created ? 'CREATED' : 'UPDATED',
    newTitle: title,
    newDescription: description,
    newStartDatetime: startDt,
    newEndDatetime: endDt,
    changedById: req.user.id,
    changeReason: 'Created via API',
  });

  candidate.googleEventId = googleEventId;
  candidate.scheduledDatetime = startDt;
  candidate.scheduleDescription = description;
  await candidate.save();

  return res.json({
    message: 'Event created successfully',
    google_event_id: googleEventId,
  });
}

async function candidateEventHistory(req, res) {
  const candidateId = parseInt(req.params.candidate_id, 10);
  const candidate = await Candidate.findOne({ id: candidateId, isDeleted: false });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  const event = await CandidateCalendarEvent.findOne({ candidateId });
  if (!event) {
    return res.json({
      candidate_id: candidate.id,
      candidate_name: candidate.candidateName,
      history: [],
    });
  }

  const historyRows = await CandidateCalendarEventHistory.find({ eventId: event.id });
  historyRows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const changedByIds = [...new Set(historyRows.map((h) => h.changedById).filter(Boolean))];
  const users = changedByIds.length
    ? await User.find({ id: { $in: changedByIds } })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  const history = historyRows.map((h) => ({
    candidate_name: candidate.candidateName,
    action_type: h.actionType,
    previous_title: h.previousTitle,
    new_title: h.newTitle,
    previous_description: h.previousDescription,
    new_description: h.newDescription,
    previous_start: h.previousStartDatetime,
    previous_end: h.previousEndDatetime,
    new_start: h.newStartDatetime,
    new_end: h.newEndDatetime,
    changed_by: userMap.get(h.changedById)?.email || null,
    created_at: h.createdAt,
  }));

  return res.json({
    candidate_id: candidate.id,
    candidate_name: candidate.candidateName,
    history,
  });
}

module.exports = {
  googleConnect,
  googleCallback,
  testGoogleApi,
  createCandidateEvent,
  candidateEventHistory,
  resolveReqUser,
};
