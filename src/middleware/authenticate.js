'use strict';

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches the decoded payload to req.user.
 * Also checks if the user is blocked.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user is currently blocked in the DB
    const user = await User.findById(decoded.sub).select('status').lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked by administrator.' });
    }

    req.user = decoded; // { sub, email, name, role, iat, exp }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
