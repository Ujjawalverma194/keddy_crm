const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config');

const landingRoutes = require('./routes/landing.routes');
const employeePortalRoutes = require('./routes/employeePortal.routes');
const subAdminRoutes = require('./routes/subAdmin.routes');
const jdMappingRoutes = require('./routes/jdMapping.routes');
const invoicingRoutes = require('./routes/invoicing.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const calendarRoutes = require('./routes/calendar.routes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 },
  })
);

// Static media (same URL as Django)
app.use(config.mediaUrl, express.static(config.mediaRoot));

// API routes — same prefixes as Django
app.use('/', landingRoutes);
app.use('/employee-portal/', employeePortalRoutes);
app.use('/sub-admin/', subAdminRoutes);
app.use('/jd-mapping/', jdMappingRoutes);
app.use('/invoice/', invoicingRoutes);
app.use('/attendance/', attendanceRoutes);
app.use('/calendar/', calendarRoutes);

app.get('/health/', (_req, res) => {
  res.json({ status: 'ok', backend: 'nodejs', database: 'postgresql' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ detail: 'Internal server error' });
});

module.exports = app;
