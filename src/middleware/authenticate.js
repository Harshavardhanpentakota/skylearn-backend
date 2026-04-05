'use strict';

const jwt = require('jsonwebtoken');

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches the decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { sub, email, name, role, iat, exp }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
