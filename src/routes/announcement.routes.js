'use strict';

const { Router }   = require('express');
const authenticate = require('../middleware/authenticate');
const announcementController = require('../controllers/announcement.controller');

const router = Router();

// All announcement routes require a valid JWT
router.get('/',              authenticate, announcementController.getAll);
router.get('/unread-count',  authenticate, announcementController.getUnreadCount);
router.post('/:id/read',     authenticate, announcementController.markRead);

module.exports = router;
