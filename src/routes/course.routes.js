'use strict';

const { Router }       = require('express');
const optionalAuth     = require('../middleware/optionalAuth');
const courseController = require('../controllers/course.controller');

const router = Router();

router.use(optionalAuth);

router.get('/', courseController.getAll);
router.get('/:id', courseController.getById);

module.exports = router;
