'use strict';

const mongoose = require('mongoose');

// Reusable transform: exposes id string, removes _id/__v
const makeTransform = (keepV = false) => ({
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    if (!keepV) delete ret.__v;
    return ret;
  },
});

// ─── Topic ───────────────────────────────────────────────────────────────────
const TopicSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    videoUrl:  { type: String, trim: true },
    notes:     { type: String, default: '' },
  },
  { toJSON: makeTransform() }
);

// ─── Module ──────────────────────────────────────────────────────────────────
const ModuleSchema = new mongoose.Schema(
  {
    title:  { type: String, required: true, trim: true },
    topics: { type: [TopicSchema], default: [] },
  },
  { toJSON: makeTransform() }
);

// ─── Course ──────────────────────────────────────────────────────────────────
const CourseSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true, trim: true },
    description:  { type: String, trim: true },
    thumbnail:    { type: String, trim: true },
    progress:     { type: Number, default: 0, min: 0, max: 100 },
    lessonsCount: { type: Number, default: 0, min: 0 },
    modules:      { type: [ModuleSchema], default: [] },
  },
  { timestamps: true, toJSON: makeTransform(true) }
);

module.exports = mongoose.model('Course', CourseSchema);
