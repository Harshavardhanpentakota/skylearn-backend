'use strict';

const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    date:        { type: String, required: true },
    targetRole:  { type: String, enum: ['all', 'student', 'admin'], default: 'all' },
    readBy:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
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

module.exports = mongoose.model('Announcement', AnnouncementSchema);
