import { authService } from '../services/authService.js';
import ApiResponse from '../utils/responseUtils.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

/**
 * Auth controller — thin HTTP adapter.
 * All input validation is handled by authValidators.js middleware upstream.
 * All business logic lives in authService.js.
 */
const authController = {
  /**
   * POST /auth/register
   */
  async register(req, res) {
    try {
      const { email, password, full_name, avatar_url } = req.body;
      logger.info('Register request for:', email);

      const result = await authService.register({ email, password, full_name, avatar_url });

      return ApiResponse.created(res, result, 'Đăng ký thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.EMAIL_ALREADY_EXISTS) {
        return ApiResponse.conflict(res, error.message);
      }
      logger.error('Register error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * POST /auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      logger.info('Login request for:', email);

      const result = await authService.login({ email, password });
      logger.info('Login successful for userId:', result.user.id);
      return ApiResponse.success(res, result, 'Đăng nhập thành công');
    } catch (error) {
      if (
        error.message === ERROR_MESSAGES.INVALID_CREDENTIALS ||
        error.message === ERROR_MESSAGES.WRONG_AUTH_PROVIDER
      ) {
        return ApiResponse.unauthorized(res, error.message);
      }
      logger.error('Login error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * POST /auth/logout
   */
  async logout(req, res) {
    try {
      // JWT is stateless — logout is client-side token removal.
      // Server-side blacklisting can be added here if required.
      logger.info('Logout request, userId:', req.user ? req.user.userId : null);
      return ApiResponse.success(res, null, 'Đăng xuất thành công');
    } catch (error) {
      logger.error('Logout error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * GET /auth/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      logger.info('GetProfile for userId:', userId);

      const user = await authService.getProfile(userId);

      return ApiResponse.success(res, user, 'Lấy thông tin thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.USER_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      logger.error('Get profile error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * PATCH /auth/profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      logger.info('UpdateProfile for userId:', userId);

      const { full_name, avatar_url } = req.body;

      const user = await authService.updateProfile(userId, { full_name, avatar_url });

      return ApiResponse.success(res, user, 'Cập nhật thông tin thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.USER_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      logger.error('Update profile error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * PATCH /auth/change-password
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      logger.info('ChangePassword requested for userId:', userId);

      const { oldPassword, newPassword } = req.body;

      const result = await authService.changePassword(userId, { oldPassword, newPassword });

      return ApiResponse.success(res, result, 'Đổi mật khẩu thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.WRONG_OLD_PASSWORD) {
        return ApiResponse.badRequest(res, error.message);
      }
      logger.error('Change password error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * POST /auth/google
   */
  async loginWithGoogle(req, res) {
    try {
      const { id_token, full_name, email } = req.body;
      logger.info('Google login request for email:', email);

      const result = await authService.loginWithGoogle({
        idToken: id_token,
        displayName: full_name,
        email,
      });

      logger.info('Google login successful for:', result.user.email);
      return ApiResponse.success(res, result, 'Đăng nhập Google thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.INVALID_GOOGLE_TOKEN) {
        return ApiResponse.unauthorized(res, error.message);
      }
      logger.error('Google login error:', error);
      return ApiResponse.error(res, error.message);
    }
  },
};

export default authController;
