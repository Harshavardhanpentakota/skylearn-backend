'use strict';

const Certificate = require('../models/Certificate');

const findAll = () => Certificate.find().sort({ completionDate: -1 });

module.exports = { findAll };
