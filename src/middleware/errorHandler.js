'use strict';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // Mongoose CastError — invalid ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  console.error('[Error]', err);

  return res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal Server Error',
  });
};

module.exports = errorHandler;
