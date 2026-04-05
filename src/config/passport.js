'use strict';

const passport     = require('passport');
const authService  = require('../services/auth.service');

// Minimal serialization — only used during the OAuth redirect cycle
passport.serializeUser((user, done) => done(null, user._id.toString()));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await authService.findById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

// Register Google strategy only when credentials are present
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;

  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL}/api/auth/google/callback`,
        scope:        ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email  = profile.emails?.[0]?.value || null;
          const avatar = profile.photos?.[0]?.value || null;

          const { user } = await authService.findOrCreateGoogleUser({
            googleId: profile.id,
            email,
            name: profile.displayName,
            avatar,
          });

          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
} else {
  console.warn('[passport] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google OAuth disabled.');
}

module.exports = passport;
