import jwtUtils from '../utils/jwtUtils.js';
import responseUtils from '../utils/responseUtils.js';

const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('authMiddleware: missing Authorization header');
      return responseUtils.unauthorized(res, 'Vui lòng đăng nhập để tiếp tục');
    }

    // Token có format: "Bearer <token>"
    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('authMiddleware: malformed Authorization header');
      return responseUtils.unauthorized(res, 'Token không hợp lệ');
    }

    // Verify token
    const decoded = jwtUtils.verifyToken(token);
    console.log('authMiddleware: token decoded for userId:', decoded.userId);

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

export default authMiddleware;
