'use strict';

const os         = require('os');
const jwt        = require('jsonwebtoken');
const User       = require('../models/User');
const authService = require('../services/auth.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return the first non-loopback IPv4 address of this machine, or 127.0.0.1 */
const getMachineIp = () => {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
};

const normalizeIp = (ip) => {
  if (!ip) return 'unknown';
  // Loopback → use the machine's real LAN IP (covers local-dev same-machine access)
  if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1') {
    return getMachineIp();
  }
  // Strip IPv4-mapped prefix (::ffff:x.x.x.x)
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
};

const getClientIp = (req) => {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return normalizeIp(fwd.split(',')[0].trim());
  return normalizeIp(req.ip || req.socket?.remoteAddress);
};

const signToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const safeUser = (user) => ({
  id:     user._id.toString(),
  name:   user.name,
  email:  user.email,
  avatar: user.avatar || null,
  role:   user.role,
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email, and password are required' });

    const existing = await authService.findByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user  = await authService.createUser({ name, email, password });
    const token = signToken(user);

    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ────────────────────────────────────────────────────

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await authService.findByEmail(email);
    if (!user || !user.password)
      return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    const ip    = getClientIp(req);

    // Non-blocking: record login without delaying response
    authService.recordLogin(user._id, ip, req.headers['user-agent'], 'email').catch(console.error);

    res.json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ────────────────────────────────────────────────────────

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/login-history ─────────────────────────────────────────────

const loginHistory = async (req, res, next) => {
  try {
    const history = await authService.getLoginHistory(req.user.sub);
    res.json(history);
  } catch (err) {
    next(err);
  }
};

// ─── GET /auth/google/callback ───────────────────────────────────────────────

const googleCallback = (req, res) => {
  try {
    const user  = req.user;
    const token = signToken(user);
    const ip    = getClientIp(req);

    // Non-blocking
    authService.recordLogin(user._id, ip, req.headers['user-agent'], 'google').catch(console.error);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};

module.exports = { register, login, me, loginHistory, googleCallback };
