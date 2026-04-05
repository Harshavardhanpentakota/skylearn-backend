'use strict';

const Announcement = require('../models/Announcement');

const findAll = () => Announcement.find().sort({ date: -1 });

module.exports = { findAll };
