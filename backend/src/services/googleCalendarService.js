const config = require('../config');
const { GoogleCalendarAccount } = require('../models/Calendar');

async function getActiveAccount(userId) {
  return GoogleCalendarAccount.findOne({ userId, isActive: true });
}

async function refreshAccessToken(account) {
  if (!account?.refreshToken) return null;

  const body = new URLSearchParams({
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret,
    refresh_token: account.refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokenJson = await response.json();

  if (!tokenJson.access_token) return null;

  account.accessToken = tokenJson.access_token;
  const expiresIn = tokenJson.expires_in || 3600;
  account.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
  await account.save();
  return account.accessToken;
}

async function ensureValidToken(account) {
  if (!account) return null;
  if (account.tokenExpiry && new Date(account.tokenExpiry) > new Date()) {
    return account.accessToken;
  }
  return refreshAccessToken(account);
}

async function testGoogleConnection(user) {
  const account = await getActiveAccount(user.id);
  if (!account) return { error: 'Google account not connected.' };

  const token = await ensureValidToken(account);
  if (!token) return { error: 'Access token expired and refresh failed.' };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList/primary',
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (response.status === 200) return response.json();
  const details = await response.json().catch(() => ({}));
  return { error: 'Google API call failed.', details };
}

async function createGoogleEvent(user, title, description, startDatetime, endDatetime) {
  let account = await getActiveAccount(user.id);
  if (!account) return { error: 'Google account not connected.' };

  let token = await ensureValidToken(account);
  if (!token) return { error: 'Failed to refresh access token.' };

  const eventData = {
    summary: title,
    description: description || '',
    start: {
      dateTime: new Date(startDatetime).toISOString(),
      timeZone: config.timezone,
    },
    end: {
      dateTime: new Date(endDatetime).toISOString(),
      timeZone: config.timezone,
    },
    attendees: [{ email: user.email }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 0 },
      ],
    },
  };

  const postEvent = async (accessToken) => {
    return fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );
  };

  let response = await postEvent(token);

  if (response.status === 401) {
    token = await refreshAccessToken(account);
    if (!token) return { error: 'Authentication failed after refresh.' };
    response = await postEvent(token);
  }

  if (response.status === 200) return response.json();

  const details = await response.json().catch(() => ({}));
  return { error: 'Failed to create event', details };
}

module.exports = {
  getActiveAccount,
  refreshAccessToken,
  ensureValidToken,
  testGoogleConnection,
  createGoogleEvent,
};
