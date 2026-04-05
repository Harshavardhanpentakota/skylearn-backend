'use strict';

require('dotenv').config();

const app       = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected');

    // Start server (IMPORTANT: 0.0.0.0 for AWS)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SkyLearn backend running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        const mongoose = require('mongoose');
        await mongoose.disconnect();
        console.log('📦 MongoDB disconnected');

        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();