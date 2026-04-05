'use strict';

const { Router } = require('express');
const announcementController = require('../controllers/announcement.controller');

const router = Router();

router.get('/', announcementController.getAll);

module.exports = router;
