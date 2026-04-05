'use strict';

const { Router }   = require('express');
const authenticate = require('../middleware/authenticate');
const adminOnly    = require('../middleware/adminOnly');
const admin        = require('../controllers/admin.controller');

const router = Router();

// Every admin route requires a valid JWT + admin role
router.use(authenticate, adminOnly);

// ── Stats ──────────────────────────────────────────────────────────────────
router.get('/stats', admin.getStats);

// ── Users ──────────────────────────────────────────────────────────────────
router.get('/users',     admin.getUsers);
router.put('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);

// ── Courses ────────────────────────────────────────────────────────────────
router.get('/courses',         admin.getCourses);
router.post('/courses',        admin.createCourse);
router.put('/courses/:id',     admin.updateCourse);
router.delete('/courses/:id',  admin.deleteCourse);

// ── Modules ────────────────────────────────────────────────────────────────
router.post('/courses/:id/modules',              admin.addModule);
router.delete('/courses/:id/modules/:moduleId',  admin.deleteModule);

// ── Topics ─────────────────────────────────────────────────────────────────
router.post('/courses/:id/modules/:moduleId/topics',                  admin.addTopic);
router.delete('/courses/:id/modules/:moduleId/topics/:topicId',       admin.deleteTopic);
router.put('/courses/:id/modules/:moduleId/topics/:topicId/notes',    admin.updateTopicNotes);

// ── Activity ───────────────────────────────────────────────────────────────
router.get('/activity',   admin.getActivity);

// ── Suspicious ─────────────────────────────────────────────────────────────
router.get('/suspicious', admin.getSuspiciousActivity);

module.exports = router;
