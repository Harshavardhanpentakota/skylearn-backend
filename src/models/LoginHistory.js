'use strict';

const mongoose = require('mongoose');

const LoginHistorySchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ip:          { type: String, required: true },
    userAgent:   { type: String, default: null },
    method:      { type: String, enum: ['email', 'google'], default: 'email' },
    isNewDevice: { type: Boolean, default: false },
    deviceId:    { type: String, default: null },
    browser:     { type: String, default: null },
    os:          { type: String, default: null },
    eventType:   { type: String, enum: ['login', 'blocked_attempt'], default: 'login' },
    faceCard:    { type: String, default: null },
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
