'use strict';

const mongoose = require('mongoose');

/**
 * Tracks which topics a specific user has completed for a given course.
 * completedTopics is an array of topic _id strings.
 */
const UserProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    completedTopics: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// One progress record per user per course
UserProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);
