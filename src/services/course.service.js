'use strict';

const Course         = require('../models/Course');
const progressService = require('./progress.service');

const findAll = () => Course.find().sort({ createdAt: 1 });

const findById = (id) => Course.findById(id);

/**
 * Returns all courses with per-user progress merged in.
 * - course.progress  → % of topics the user has completed
 * - topic.completed  → true if this user has completed that topic
 */
const findAllWithProgress = async (userId) => {
  const [courses, completedMap] = await Promise.all([
    findAll(),
    progressService.findAllByUser(userId),
  ]);

  return courses.map((course) => {
    const courseObj  = course.toJSON();
    const courseId   = course._id.toString();
    const completed  = completedMap[courseId] || [];
    const allTopics  = courseObj.modules.flatMap((m) => m.topics);
    const totalTopics = allTopics.length;

    // Stamp completed flag per topic
    courseObj.modules = courseObj.modules.map((mod) => ({
      ...mod,
      topics: mod.topics.map((t) => ({
        ...t,
        completed: completed.includes(t.id),
      })),
    }));

    courseObj.progress = totalTopics > 0
      ? Math.round((completed.length / totalTopics) * 100)
      : 0;

    return courseObj;
  });
};

/**
 * Returns a single course with per-user progress merged in.
 */
const findByIdWithProgress = async (courseId, userId) => {
  const [course, completedTopics] = await Promise.all([
    findById(courseId),
    progressService.findByCourseAndUser(userId, courseId),
  ]);

  if (!course) return null;

  const courseObj  = course.toJSON();
  const allTopics  = courseObj.modules.flatMap((m) => m.topics);
  const totalTopics = allTopics.length;

  courseObj.modules = courseObj.modules.map((mod) => ({
    ...mod,
    topics: mod.topics.map((t) => ({
      ...t,
      completed: completedTopics.includes(t.id),
    })),
  }));

  courseObj.progress = totalTopics > 0
    ? Math.round((completedTopics.length / totalTopics) * 100)
    : 0;

  return courseObj;
};

module.exports = { findAll, findById, findAllWithProgress, findByIdWithProgress };
