'use strict';

const { Router }    = require('express');
const passport      = require('passport');
const authController = require('../controllers/auth.controller');
const authenticate  = require('../middleware/authenticate');

const router = Router();

const googleEnabled = () =>
  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const frontendUrl = () =>
  process.env.FRONTEND_URL || 'http://localhost:5173';

// Public — email/password
router.post('/register', authController.register);
router.post('/login',    authController.login);

// Google OAuth — initiates the redirect to Google
router.get('/google', (req, res, next) => {
  if (!googleEnabled()) {
    return res.status(503).json({ error: 'Google OAuth is not configured on this server.' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Google OAuth — callback from Google
router.get(
  '/google/callback',
  (req, res, next) => {
    if (!googleEnabled()) {
      return res.redirect(`${frontendUrl()}/login?error=oauth_failed`);
    }
    passport.authenticate('google', {
      failureRedirect: `${frontendUrl()}/login?error=oauth_failed`,
      session: false,
    })(req, res, next);
  },
  authController.googleCallback
);

// Protected (JWT required)
router.get('/me',               authenticate, authController.me);
router.get('/login-history',    authenticate, authController.loginHistory);
router.get('/suspicious-check', authenticate, authController.suspiciousCheck);

module.exports = router;
