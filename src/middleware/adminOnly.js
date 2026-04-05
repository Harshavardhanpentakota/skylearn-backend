'use strict';

/**
 * Requires the request to already have passed authenticate middleware.
 * Rejects with 403 if the authenticated user is not an admin.
 */
const adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = adminOnly;
