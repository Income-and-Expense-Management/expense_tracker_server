const authService = require('../services/authService');
const responseUtils = require('../utils/responseUtils');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, full_name, avatar_url } = req.body;

      // Validate input
      if (!email || !password) {
        return responseUtils.badRequest(res, 'Email và mật khẩu là bắt buộc');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return responseUtils.badRequest(res, 'Email không hợp lệ');
      }

      // Validate password length
      if (password.length < 6) {
        return responseUtils.badRequest(res, 'Mật khẩu phải có ít nhất 6 ký tự');
      }

      const result = await authService.register({
        email,
        password,
        full_name,
        avatar_url,
      });

      return responseUtils.created(res, result, 'Đăng ký thành công');
    } catch (error) {
      if (error.message === 'Email đã được sử dụng') {
        return responseUtils.conflict(res, error.message);
      }
      console.error('Register error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return responseUtils.badRequest(res, 'Email và mật khẩu là bắt buộc');
      }

      const result = await authService.login({ email, password });
      console.log('Login result:', result);
      return responseUtils.success(res, result, 'Đăng nhập thành công');
    } catch (error) {
      if (
        error.message === 'Email hoặc mật khẩu không đúng' ||
        error.message === 'Tài khoản này sử dụng phương thức đăng nhập khác'
      ) {
        return responseUtils.unauthorized(res, error.message);
      }
      console.error('Login error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async logout(req, res) {
    try {
      // Với JWT, logout chủ yếu xử lý ở phía client (xóa token)
      // Server có thể implement blacklist nếu cần
      return responseUtils.success(res, null, 'Đăng xuất thành công');
    } catch (error) {
      console.error('Logout error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = await authService.getProfile(userId);

      return responseUtils.success(res, user, 'Lấy thông tin thành công');
    } catch (error) {
      if (error.message === 'Không tìm thấy người dùng') {
        return responseUtils.notFound(res, error.message);
      }
      console.error('Get profile error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { full_name, avatar_url } = req.body;

      const user = await authService.updateProfile(userId, {
        full_name,
        avatar_url,
      });

      return responseUtils.success(res, user, 'Cập nhật thông tin thành công');
    } catch (error) {
      console.error('Update profile error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { oldPassword, newPassword } = req.body;

      // Validate input
      if (!oldPassword || !newPassword) {
        return responseUtils.badRequest(res, 'Mật khẩu cũ và mật khẩu mới là bắt buộc');
      }

      if (newPassword.length < 6) {
        return responseUtils.badRequest(res, 'Mật khẩu mới phải có ít nhất 6 ký tự');
      }

      const result = await authService.changePassword(userId, {
        oldPassword,
        newPassword,
      });

      return responseUtils.success(res, result, 'Đổi mật khẩu thành công');
    } catch (error) {
      if (error.message === 'Mật khẩu cũ không đúng') {
        return responseUtils.badRequest(res, error.message);
      }
      console.error('Change password error:', error);
      return responseUtils.error(res, error.message);
    }
  }
}

module.exports = new AuthController();
