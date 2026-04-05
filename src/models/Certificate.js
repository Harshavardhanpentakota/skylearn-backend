'use strict';

const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
  {
    courseTitle:    { type: String, required: true, trim: true },
    completionDate: { type: String, required: true },
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

module.exports = mongoose.model('Certificate', CertificateSchema);
