const userRepository = require('../repositories/userRepository');
const passwordUtils = require('../utils/passwordUtils');
const jwtUtils = require('../utils/jwtUtils');

class AuthService {
  async register({ email, password, full_name, avatar_url }) {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }

    // Mã hóa mật khẩu
    const hashedPassword = await passwordUtils.hashPassword(password);

    // Tạo user mới
    const user = await userRepository.create({
      email,
      password: hashedPassword,
      full_name: full_name || null,
      avatar_url: avatar_url || null,
      auth_provider: 'local',
    });

    // Tạo JWT token
    const token = jwtUtils.generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user,
      token,
    };
  }

  async login({ email, password }) {
    // Tìm user theo email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra nếu user đăng ký bằng provider khác
    if (!user.password) {
      throw new Error('Tài khoản này sử dụng phương thức đăng nhập khác');
    }

    // So sánh mật khẩu
    const isPasswordValid = await passwordUtils.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Tạo JWT token
    const token = jwtUtils.generateToken({
      userId: user.id,
      email: user.email,
    });

    // Loại bỏ password khỏi response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }
    return user;
  }

  async updateProfile(userId, { full_name, avatar_url }) {
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const user = await userRepository.update(userId, updateData);
    return user;
  }

  async changePassword(userId, { oldPassword, newPassword }) {
    const user = await userRepository.findByEmail(
      (await userRepository.findById(userId)).email
    );

    // Kiểm tra mật khẩu cũ
    const isPasswordValid = await passwordUtils.comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Mật khẩu cũ không đúng');
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await passwordUtils.hashPassword(newPassword);

    // Cập nhật mật khẩu
    await userRepository.update(userId, { password: hashedPassword });

    return { message: 'Đổi mật khẩu thành công' };
  }
}

module.exports = new AuthService();
