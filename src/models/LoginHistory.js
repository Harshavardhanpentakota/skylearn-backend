'use strict';

const mongoose = require('mongoose');

const LoginHistorySchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ip:        { type: String, required: true },
    userAgent: { type: String, default: null },
    method:    { type: String, enum: ['email', 'google'], default: 'email' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('LoginHistory', LoginHistorySchema);
