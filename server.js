'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app       = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`SkyLearn backend running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received � shutting down gracefully...`);
    server.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.disconnect();
      console.log('MongoDB disconnected. Process exiting.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
})().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
