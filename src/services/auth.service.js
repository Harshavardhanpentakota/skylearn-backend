'use strict';

const User         = require('../models/User');
const LoginHistory = require('../models/LoginHistory');

// ─── User helpers ─────────────────────────────────────────────────────────────

const findByEmail = (email) =>
  User.findOne({ email: email.toLowerCase() });

const findById = (id) => User.findById(id);

const findOrCreateGoogleUser = async ({ googleId, email, name, avatar }) => {
  // 1. Match by Google ID
  let user = await User.findOne({ googleId });
  if (user) return { user, isNew: false };

  // 2. Match by email → link Google ID to existing account
  if (email) {
    user = await findByEmail(email);
    if (user) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = avatar;
      await user.save();
      return { user, isNew: false };
    }
  }

  // 3. Create a brand-new user
  const hash = null; // Google-only accounts have no local password
  user = await User.create({ googleId, email: email || `${googleId}@google.com`, name, avatar, password: hash });
  return { user, isNew: true };
};

const createUser = async ({ name, email, password }) => {
  const hash = await User.hashPassword(password);
  return User.create({ name, email: email.toLowerCase(), password: hash });
};

// ─── Login history ────────────────────────────────────────────────────────────

/**
 * Records a login event. Detects if the IP is new for this user (possible new device/location).
 * Non-blocking: caller should fire-and-forget.
 */
const recordLogin = async (userId, ip, userAgent, method = 'email') => {
  const existingFromIp = await LoginHistory.findOne({ userId, ip }).lean();
  const isNewDevice    = !existingFromIp;
  return LoginHistory.create({ userId, ip, userAgent: userAgent || null, method, isNewDevice });
};

const getLoginHistory = (userId, limit = 10) =>
  LoginHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);

module.exports = {
  findByEmail,
  findById,
  findOrCreateGoogleUser,
  createUser,
  recordLogin,
  getLoginHistory,
};
