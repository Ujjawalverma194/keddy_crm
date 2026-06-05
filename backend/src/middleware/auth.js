const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided.' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findOne({ id: payload.userId, isActive: true, isDeleted: false });
    if (!user) return res.status(401).json({ detail: 'Invalid token.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ detail: 'Invalid or expired token.' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();
  return authenticate(req, res, next);
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ detail: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { authenticate, optionalAuth, requireRoles };
