'use strict';

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not defined');
  }

  mongoose.connection.on('connected', () =>
    console.log(`MongoDB connected: ${mongoose.connection.host}`)
  );
  mongoose.connection.on('error', (err) =>
    console.error('MongoDB connection error:', err)
  );

  await mongoose.connect(uri);
};

module.exports = connectDB;
