'use strict';

const UserProgress = require('../models/UserProgress');

/**
 * Returns all progress records for a user as a plain object map:
 *   { [courseId]: string[] }
 */
const findAllByUser = async (userId) => {
  const records = await UserProgress.find({ userId }).lean();
  return records.reduce((map, rec) => {
    map[rec.courseId.toString()] = rec.completedTopics;
    return map;
  }, {});
};

/**
 * Returns the completed-topic array for one course.
 * Returns [] if no record exists yet.
 */
const findByCourseAndUser = async (userId, courseId) => {
  const rec = await UserProgress.findOne({ userId, courseId }).lean();
  return rec ? rec.completedTopics : [];
};

/**
 * Toggles a topic in the user's progress for a course.
 * Adds topicId if not present; removes if already present.
 * Returns the updated completedTopics array.
 */
const toggleTopic = async (userId, courseId, topicId) => {
  const rec = await UserProgress.findOne({ userId, courseId });

  if (!rec) {
    const created = await UserProgress.create({ userId, courseId, completedTopics: [topicId] });
    return created.completedTopics;
  }

  const idx = rec.completedTopics.indexOf(topicId);
  if (idx === -1) {
    rec.completedTopics.push(topicId);
  } else {
    rec.completedTopics.splice(idx, 1);
  }

  await rec.save();
  return rec.completedTopics;
};

module.exports = { findAllByUser, findByCourseAndUser, toggleTopic };
