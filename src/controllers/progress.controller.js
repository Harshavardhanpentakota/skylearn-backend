'use strict';

const progressService = require('../services/progress.service');
const courseService   = require('../services/course.service');

/**
 * POST /api/progress/:courseId/topics/:topicId/toggle
 * Toggles a topic complete/incomplete for the authenticated user.
 * Returns updated progress % and completedTopics array.
 */
const toggleTopic = async (req, res, next) => {
  try {
    const { courseId, topicId } = req.params;
    const userId = req.user.sub;

    // Verify course + topic exist
    const course = await courseService.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const allTopics = course.modules.flatMap((m) => m.topics);
    const topicExists = allTopics.some((t) => t._id.toString() === topicId || t.id === topicId);
    if (!topicExists) return res.status(404).json({ error: 'Topic not found' });

    const completedTopics = await progressService.toggleTopic(userId, courseId, topicId);

    const totalTopics = allTopics.length;
    const progress = totalTopics > 0
      ? Math.round((completedTopics.length / totalTopics) * 100)
      : 0;

    res.json({ courseId, completedTopics, progress });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/progress
 * Returns a map of courseId → { completedTopics, progress } for the authenticated user.
 */
const getAll = async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const completedMap = await progressService.findAllByUser(userId);

    // Enrich with progress % using course topic counts
    const courses = await courseService.findAll();
    const result = {};

    for (const course of courses) {
      const id = course._id.toString();
      const completed = completedMap[id] || [];
      const totalTopics = course.modules.flatMap((m) => m.topics).length;
      result[id] = {
        completedTopics: completed,
        progress: totalTopics > 0 ? Math.round((completed.length / totalTopics) * 100) : 0,
      };
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { toggleTopic, getAll };
