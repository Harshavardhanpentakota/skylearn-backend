'use strict';

const mongoose = require('mongoose');

/**
 * Audit log for admin-level security actions.
 * eventType: 'block' | 'unblock' | 'blocked_login_attempt'
 */
const ActivityLogSchema = new mongoose.Schema(
  {
    eventType:    { type: String, enum: ['block', 'unblock', 'blocked_login_attempt'], required: true, index: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    performedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    ip:           { type: String, default: null },
    details:      { type: String, default: null },
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

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
