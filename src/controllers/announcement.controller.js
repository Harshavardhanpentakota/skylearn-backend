'use strict';

const announcementService = require('../services/announcement.service');

const getAll = async (req, res, next) => {
  try {
    const announcements = await announcementService.findAll();
    res.json(announcements);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll };
