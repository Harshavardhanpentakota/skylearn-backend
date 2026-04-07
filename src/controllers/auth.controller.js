'use strict';

const jwt        = require('jsonwebtoken');
const User       = require('../models/User');
const authService = require('../services/auth.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true for loopback and RFC-1918 private addresses.
 * 172.31.x.x is the AWS VPC range — treat it as internal.
 */
const isPrivateIp = (ip) => {
  if (!ip || ip === '::1') return true;
  return (
    /^127\./.test(ip) ||
    /^10\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^192\.168\./.test(ip)
  );
};

/** Strip IPv4-mapped prefix (::ffff:x.x.x.x → x.x.x.x) */
const cleanIp = (ip) =>
  ip && ip.startsWith('::ffff:') ? ip.slice(7) : ip;

/**
 * Extracts the real client IP.
 *
 * Strategy (AWS-safe):
 *   1. Walk x-forwarded-for LEFT→RIGHT and return the first PUBLIC IP.
 *      (Leftmost = original client; rightmost entries are added by proxies we trust)
 *   2. If all x-forwarded-for entries are private/internal, fall back to req.ip.
 *   3. Return the value as-is — never substitute with the machine's own IP.
 */
const getClientIp = (req) => {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) {
    for (const raw of fwd.split(',')) {
      const ip = cleanIp(raw.trim());
      if (ip && !isPrivateIp(ip)) return ip;
    }
  }
  // Fallback: req.ip (may be private in VPC — stored as-is, not substituted)
  return cleanIp(req.ip || req.socket?.remoteAddress || 'unknown');
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

// ─── GET /api/auth/suspicious-check ──────────────────────────────────────────
// Returns the most recent login entry and whether it came from a new device/IP.

const LoginHistory = require('../models/LoginHistory');

const suspiciousCheck = async (req, res, next) => {
  try {
    const latest = await LoginHistory
      .findOne({ userId: req.user.sub })
      .sort({ createdAt: -1 })
      .lean();

    if (!latest) return res.json({ isNewDevice: false });

    res.json({
      isNewDevice: latest.isNewDevice || false,
      ip:          latest.ip,
      method:      latest.method,
      createdAt:   latest.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, me, loginHistory, googleCallback, suspiciousCheck };
