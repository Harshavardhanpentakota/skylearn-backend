'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null }, // null for Google-only accounts
    googleId: { type: String, sparse: true, unique: true }, // omit when absent (sparse index ignores missing)
    avatar:   { type: String },
    role:     { type: String, enum: ['student', 'admin'], default: 'student' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password; // never expose the hash
        return ret;
      },
    },
  }
);

// Instance method: compare plain-text password against stored hash
UserSchema.methods.comparePassword = function (plain) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(plain, this.password);
};

// Static: hash a password (used in service layer)
UserSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, 10);

module.exports = mongoose.model('User', UserSchema);
