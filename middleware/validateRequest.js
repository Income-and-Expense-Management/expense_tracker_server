import { validationResult } from 'express-validator';
import responseUtils from '../utils/responseUtils.js';

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

export default validateRequest;
