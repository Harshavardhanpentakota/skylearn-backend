'use strict';

const { Router } = require('express');
const certificateController = require('../controllers/certificate.controller');

const router = Router();

router.get('/', certificateController.getAll);

module.exports = router;
