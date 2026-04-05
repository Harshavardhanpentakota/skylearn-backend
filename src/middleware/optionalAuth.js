'use strict';

const jwt = require('jsonwebtoken');

/**
 * Like authenticate, but never rejects the request.
 * If a valid Bearer token is present, req.user is populated.
 * Otherwise req.user stays undefined and the request continues.
 */
const optionalAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // invalid / expired – just ignore
    }
  }
  next();
};

module.exports = optionalAuth;
