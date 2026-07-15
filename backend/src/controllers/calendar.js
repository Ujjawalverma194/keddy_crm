const { google } = require('googleapis');
const { User, Candidate } = require('../models/sequelize/init');
const dotenv = require('dotenv');
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// 1. Generate an Auth URL and redirect the user
exports.connectGoogleCalendar = async (req, res) => {
  try {
    const scopes = ['https://www.googleapis.com/auth/calendar.events'];
    
    // Generate a url that asks permissions for Google Calendar scopes
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // getting a refresh token
      prompt: 'consent', // force to get a new refresh token
      scope: scopes,
      state: req.user.id.toString(), // pass the user id so we know who is connecting
    });
    
    res.json({ url });
  } catch (error) {
    console.error("Error generating Google Auth URL:", error);
    res.status(500).json({ detail: "Failed to generate connection link." });
  }
};

// 2. Handle the callback from Google
exports.googleCallback = async (req, res) => {
  const { code, state } = req.query;
  const userId = state;

  if (!code || !userId) {
    return res.status(400).send("Invalid callback request.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (tokens.refresh_token) {
      await User.update(
        { googleRefreshToken: tokens.refresh_token },
        { where: { id: userId } }
      );
      
      res.send(`
        <html>
          <body>
            <h2>Google Calendar Connected Successfully!</h2>
            <p>You can close this window now.</p>
            <script>
              setTimeout(() => {
                window.close();
              }, 2000);
            </script>
          </body>
        </html>
      `);
    } else {
      // If we didn't get a refresh token, it means the user has already granted access before
      // but we might not have it in our DB. We should ask them to revoke access and try again.
      res.send(`
        <html>
          <body>
            <h2>Warning: No Refresh Token Received</h2>
            <p>It seems you have previously connected this app. Please go to your Google Account security settings, remove access to KeddyCRM, and try connecting again.</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error("Error during Google callback:", error);
    res.status(500).send("Failed to connect Google Calendar.");
  }
};

// 3. Schedule an interview
exports.scheduleInterview = async (req, res) => {
  const { candidateId, date, time } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    const candidate = await Candidate.findByPk(candidateId);

    if (!user || !candidate) {
      return res.status(404).json({ detail: "User or Candidate not found." });
    }

    if (!user.googleRefreshToken) {
      return res.status(400).json({ detail: "Google Calendar is not connected. Please connect your calendar first." });
    }

    // Set credentials
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    client.setCredentials({ refresh_token: user.googleRefreshToken });
    
    const calendar = google.calendar({ version: 'v3', auth: client });

    // Parse date and time
    // date is YYYY-MM-DD
    // time could be "HH:mm AM/PM" or "HH:mm"
    
    // Basic parser assuming 24-hour HH:mm string from input type="time"
    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration by default

    const event = {
      summary: `Interview: ${candidate.candidateName}`,
      description: `Interview scheduled with ${candidate.candidateName}.\n\nRole: ${candidate.technology || 'N/A'}\nExperience: ${candidate.yearsOfExperienceManual || 'N/A'}\n\nPlease join the attached Google Meet link at the scheduled time.`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Asia/Kolkata', // Hardcoding IST for now or use user's timezone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: [
        { email: user.email },
      ],
      conferenceData: {
        createRequest: {
          requestId: `keddycrm-${candidate.id}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    // If candidate has email, add to attendees
    if (candidate.candidateEmail) {
      event.attendees.push({ email: candidate.candidateEmail });
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    const googleEventId = response.data.id;
    const meetLink = response.data.hangoutLink;

    // Update candidate record
    await Candidate.update({
      googleEventId: googleEventId,
      scheduledDatetime: startDateTime,
      scheduleDescription: meetLink
    }, { where: { id: candidateId } });

    res.json({ message: "Interview scheduled successfully!", meetLink });

  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(500).json({ detail: "Failed to schedule interview with Google Calendar." });
  }
};
