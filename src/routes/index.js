'use strict';

const { Router } = require('express');
const authRoutes         = require('./auth.routes');
const courseRoutes       = require('./course.routes');
const announcementRoutes = require('./announcement.routes');
const certificateRoutes  = require('./certificate.routes');
const progressRoutes     = require('./progress.routes');
const adminRoutes        = require('./admin.routes');

const router = Router();

router.use('/auth',          authRoutes);
router.use('/courses',       courseRoutes);
router.use('/announcements', announcementRoutes);
router.use('/certificates',  certificateRoutes);
router.use('/progress',      progressRoutes);
router.use('/admin',         adminRoutes);

module.exports = router;
