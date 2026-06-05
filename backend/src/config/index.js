require('dotenv').config();
const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@127.0.0.1:5432/keddy_crm',
  syncDb: process.env.DB_SYNC !== 'false',
  jwtSecret: process.env.JWT_SECRET || 'keddy-crm-dev-secret-change-in-production',
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '1d',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  sessionSecret: process.env.SESSION_SECRET || 'keddy-crm-session-secret',
  mediaRoot: path.resolve(process.env.MEDIA_ROOT || path.join(__dirname, '../../media')),
  mediaUrl: process.env.MEDIA_URL || '/media/',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(','),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/calendar/google/callback/',
  },
  timezone: 'Asia/Kolkata',
};
