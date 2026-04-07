'use strict';

const announcementService = require('../services/announcement.service');

// GET /api/announcements — authenticated users, filtered by role with read status
const getAll = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role   = req.user?.role || 'student';
    if (userId) {
      const list = await announcementService.findAllForUser(userId, role);
      return res.json(list);
    }
    const list = await announcementService.findAll();
    res.json(list);
  } catch (err) {
    next(err);
  }
};

// GET /api/announcements/unread-count — count of unread for authenticated user
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await announcementService.getUnreadCount(req.user.sub, req.user.role);
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

// POST /api/announcements/:id/read — mark announcement as read
const markRead = async (req, res, next) => {
  try {
    await announcementService.markRead(req.params.id, req.user.sub);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getUnreadCount, markRead };
