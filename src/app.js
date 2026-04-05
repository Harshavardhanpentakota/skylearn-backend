'use strict';

const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const rateLimit     = require('express-rate-limit');
const session       = require('express-session');
const path          = require('path');

const passport        = require('./config/passport'); // registers strategies
const routes          = require('./routes');
const errorHandler    = require('./middleware/errorHandler');

const app = express();

// ─── Trust proxy (correct client IP behind load balancers) ───────────────────
app.set('trust proxy', 1);

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || 'http://localhost:5173'
).split(',').map((o) => o.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin header) and listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:  ['Content-Type', 'Authorization'],
  credentials:     true,
  optionsSuccessStatus: 200,
};

// Handle preflight for every route before any other middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ─── Rate limiting ───────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Session (only used for the brief OAuth redirect cycle) ──────────────────
app.use(
  session({
    secret:            process.env.SESSION_SECRET || 'skylearn-session-secret',
    resave:            false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   5 * 60 * 1000, // 5 minutes — only needed during OAuth
    },
  })
);

// ─── Passport ────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── Static – course thumbnails from the frontend public folder ──────────────
app.use(
  '/thumbnails',
  express.static(
    path.join(__dirname, '..', '..', 'skylearn-platform', 'public')
  )
);

// ─── API routes (includes /api/auth/google and /api/auth/google/callback) ────
app.use('/api', routes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

// ─── Global error handler ────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
