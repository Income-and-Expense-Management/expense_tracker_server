const jwtUtils = require('../utils/jwtUtils');
const responseUtils = require('../utils/responseUtils');

const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return responseUtils.unauthorized(res, 'Vui lòng đăng nhập để tiếp tục');
    }

    // Token có format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return responseUtils.unauthorized(res, 'Token không hợp lệ');
    }

    // Verify token
    const decoded = jwtUtils.verifyToken(token);
    
    // Gắn thông tin user vào request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return responseUtils.unauthorized(res, error.message);
  }
};

module.exports = authMiddleware;
