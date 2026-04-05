'use strict';

const certificateService = require('../services/certificate.service');

const getAll = async (req, res, next) => {
  try {
    const certificates = await certificateService.findAll();
    res.json(certificates);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll };
