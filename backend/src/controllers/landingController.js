const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

function signTokens(user) {
  const payload = { userId: user.id, email: user.email, role: user.role };
  const access = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtAccessExpires });
  const refresh = jwt.sign({ ...payload, type: 'refresh' }, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpires,
  });
  return { access, refresh };
}

async function register(req, res) {
  try {
    const { first_name, last_name, email, number, password } = req.body;
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ email: ['This field is required.'] });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ email: ['User with this email already exists.'] });

    const hashed = await User.hashPassword(password);
    await User.create({
      email: email.toLowerCase(),
      password: hashed,
      firstName: first_name,
      lastName: last_name,
      number: number || '',
      role: 'SUB_ADMIN',
    });

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000 || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ email: ['User with this email already exists.'] });
    }
    return res.status(500).json({ error: 'Registration failed', detail: err.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase(), isDeleted: false });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    const tokens = signTokens(user);

    return res.json({
      message: 'Login successful',
      role: user.role,
      access: tokens.access,
      refresh: tokens.refresh,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed' });
  }
}

async function logout(req, res) {
  req.session.destroy(() => {});
  return res.json({ message: 'Logout successful' });
}

module.exports = { register, login, logout };
