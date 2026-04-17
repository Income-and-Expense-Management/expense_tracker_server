import { authService } from '../services/authService.js';
import ApiResponse from '../utils/responseUtils.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

const authController = {
  async register(req, res) {
    try {
      const { email, password, full_name, avatar_url } = req.body;
      logger.info('Register request for:', email);

      // Validate input
      if (!email || !password) {
        return ApiResponse.badRequest(res, 'Email và mật khẩu là bắt buộc');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ApiResponse.badRequest(res, 'Email không hợp lệ');
      }

      // Validate password length
      if (password.length < 6) {
        return ApiResponse.badRequest(res, 'Mật khẩu phải có ít nhất 6 ký tự');
      }

      const result = await authService.register({
        email,
        password,
        full_name,
        avatar_url,
      });

      return ApiResponse.created(res, result, 'Đăng ký thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.EMAIL_ALREADY_EXISTS) {
        return ApiResponse.conflict(res, error.message);
      }
      logger.error('Register error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      logger.info('Login request for:', email);

      // Validate input
      if (!email || !password) {
        return ApiResponse.badRequest(res, 'Email và mật khẩu là bắt buộc');
      }

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

  async logout(req, res) {
    try {
      // Với JWT, logout chủ yếu xử lý ở phía client (xóa token)
      // Server có thể implement blacklist nếu cần
      logger.info('Logout request, userId:', req.user ? req.user.userId : null);
      return ApiResponse.success(res, null, 'Đăng xuất thành công');
    } catch (error) {
      logger.error('Logout error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

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

  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      logger.info('UpdateProfile for userId:', userId);
      const { full_name, avatar_url } = req.body;

      const user = await authService.updateProfile(userId, {
        full_name,
        avatar_url,
      });

      return ApiResponse.success(res, user, 'Cập nhật thông tin thành công');
    } catch (error) {
      logger.error('Update profile error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      logger.info('ChangePassword requested for userId:', userId);
      const { oldPassword, newPassword } = req.body;

      // Validate input
      if (!oldPassword || !newPassword) {
        return ApiResponse.badRequest(res, 'Mật khẩu cũ và mật khẩu mới là bắt buộc');
      }

      if (newPassword.length < 6) {
        return ApiResponse.badRequest(res, 'Mật khẩu mới phải có ít nhất 6 ký tự');
      }

      const result = await authService.changePassword(userId, {
        oldPassword,
        newPassword,
      });

      return ApiResponse.success(res, result, 'Đổi mật khẩu thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.WRONG_OLD_PASSWORD) {
        return ApiResponse.badRequest(res, error.message);
      }
      logger.error('Change password error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  // Thêm phương thức đăng nhập với Google
  async loginWithGoogle(req, res) {
    try {
      const { id_token, full_name, email } = req.body;
      logger.info('Google login request for email:', email);

      // Validate input
      if (!id_token) {
        return ApiResponse.badRequest(res, 'Google ID token là bắt buộc');
      }

      if (!email) {
        return ApiResponse.badRequest(res, 'Email là bắt buộc');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return ApiResponse.badRequest(res, 'Email không hợp lệ');
      }

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
