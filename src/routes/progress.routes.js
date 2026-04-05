'use strict';

const { Router }        = require('express');
const authenticate      = require('../middleware/authenticate');
const progressController = require('../controllers/progress.controller');

const router = Router();

// All progress routes require a valid JWT
router.use(authenticate);

router.get('/', progressController.getAll);
router.post('/:courseId/topics/:topicId/toggle', progressController.toggleTopic);

module.exports = router;
