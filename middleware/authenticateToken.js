import jwtUtils from '../utils/jwtUtils.js';
import ApiResponse from '../utils/responseUtils.js';
import { logger } from '../utils/logger.js';


export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!authHeader) {
      logger.debug('authMiddleware: missing Authorization header');
      return ApiResponse.unauthorized(res, 'Vui lòng đăng nhập để tiếp tục');
    }

  if (!token) {
    return ApiResponse.unauthorized(res, 'Access token is missing');
  }

  try {
    const decoded = jwtUtils.verifyToken(token);
    logger.debug('authMiddleware: token decoded for userId:', decoded.userId);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (err) {
    logger.error("authenticateToken error:", err.message);
    // Token expired or invalid
    return ApiResponse.unauthorized(res, 'Invalid or expired access token', 401);
  }
};
