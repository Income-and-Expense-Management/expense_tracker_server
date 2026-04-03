const { validationResult } = require('express-validator');
const responseUtils = require('../utils/responseUtils');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return responseUtils.badRequest(
      res,
      'Dữ liệu không hợp lệ',
      errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      }))
    );
  }
  
  next();
};

module.exports = validateRequest;
