import userRepository from '../repositories/userRepository.js';
import {passwordUtils} from '../utils/passwordUtils.js';
import jwtUtils from '../utils/jwtUtils.js';
import googleAuthUtils from '../utils/googleAuthUtils.js';

class AuthService {
  async register({ email, password, full_name, avatar_url }) {
    console.log('AuthService.register called for:', email);

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await userRepository.findByEmail(email);
    console.log('AuthService.register existingUser:', existingUser ? existingUser.id : null);
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
    console.log('AuthService.register created user id:', user.id);

    // Tạo JWT token (do not log the token value)
    const token = jwtUtils.generateToken({
      userId: user.id,
      email: user.email,
    });
    console.log('AuthService.register generated token for userId:', user.id);

    return {
      user,
      token,
    };
  }

  async login({ email, password }) {
    console.log('AuthService.login called for:', email);

    // Tìm user theo email
    const user = await userRepository.findByEmail(email);
    console.log('AuthService.login found user:', user ? user.id : null);
    if (!user) {
      console.log('AuthService.login: user not found for email:', email);
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra nếu user đăng ký bằng provider khác
    if (!user.password) {
      console.log('AuthService.login: user has no local password, provider=', user.auth_provider);
      throw new Error('Tài khoản này sử dụng phương thức đăng nhập khác');
    }

    // So sánh mật khẩu (do NOT log plaintext password)
    const isPasswordValid = await passwordUtils.comparePassword(password, user.password);
    console.log('AuthService.login password valid:', isPasswordValid);
    if (!isPasswordValid) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // Tạo JWT token
    const token = jwtUtils.generateToken({
      userId: user.id,
      email: user.email,
    });
    console.log('AuthService.login generated token for userId:', user.id);

    // Loại bỏ password khỏi response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async getProfile(userId) {
    console.log('AuthService.getProfile for userId:', userId);
    const user = await userRepository.findById(userId);
    console.log('AuthService.getProfile result:', user ? user.id : null);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }
    return user;
  }

  async updateProfile(userId, { full_name, avatar_url }) {
    console.log('AuthService.updateProfile for userId:', userId, 'payload:', { full_name, avatar_url });
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const user = await userRepository.update(userId, updateData);
    console.log('AuthService.updateProfile updated user id:', user.id);
    return user;
  }

  async changePassword(userId, { oldPassword, newPassword }) {
    console.log('AuthService.changePassword for userId:', userId);
    const userById = await userRepository.findById(userId);
    const user = await userRepository.findByEmail(userById.email);
    console.log('AuthService.changePassword found user:', user ? user.id : null);

    // Kiểm tra mật khẩu cũ (do NOT log plaintext passwords)
    const isPasswordValid = await passwordUtils.comparePassword(oldPassword, user.password);
    console.log('AuthService.changePassword old password valid:', isPasswordValid);
    if (!isPasswordValid) {
      throw new Error('Mật khẩu cũ không đúng');
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await passwordUtils.hashPassword(newPassword);

    // Cập nhật mật khẩu
    await userRepository.update(userId, { password: hashedPassword });
    console.log('AuthService.changePassword updated password for userId:', userId);

    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Login or Register with Google
   * 
   * Flow:
   * 1. Verify Google ID token
   * 2. Check if user exists by email
   * 3. If exists: update info and login
   * 4. If not exists: create new user
   * 5. Return JWT token
   * 
   * @param {string} idToken - Google ID token from Android
   * @param {string} displayName - Display name from Android
   * @param {string} email - Email from Android
   */
  async loginWithGoogle({ idToken, displayName, email }) {
    console.log('AuthService.loginWithGoogle called for email:', email);

    // Step 1: Verify Google ID token
    let googleUser;
    try {
      // Try lenient verification (handles Android vs Web client ID mismatch)
      googleUser = await googleAuthUtils.verifyGoogleTokenLenient(idToken, email);
      console.log('AuthService.loginWithGoogle: Token verified, googleId:', googleUser.googleId);
    } catch (error) {
      console.error('AuthService.loginWithGoogle: Token verification failed:', error.message);
      throw new Error('Google token không hợp lệ hoặc đã hết hạn');
    }

    // Step 2: Check if user exists
    let user = await userRepository.findByEmail(googleUser.email);
    console.log('AuthService.loginWithGoogle: Existing user:', user ? user.id : 'not found');

    if (user) {
      // Step 3a: User exists - update info if needed
      console.log('AuthService.loginWithGoogle: Updating existing user');
      
      const updateData = {};
      
      // Update avatar if changed
      if (googleUser.picture && googleUser.picture !== user.avatar_url) {
        updateData.avatar_url = googleUser.picture;
      }
      
      // Update name if not set or if Google provides better name
      if (!user.full_name && (displayName || googleUser.name)) {
        updateData.full_name = displayName || googleUser.name;
      }
      
      // Update auth_provider if user was local before
      if (user.auth_provider === 'local') {
        // Keep as local - user can still login with password
        console.log('AuthService.loginWithGoogle: User has local auth, keeping both methods');
      } else if (user.auth_provider !== 'google') {
        updateData.auth_provider = 'google';
      }

      if (Object.keys(updateData).length > 0) {
        user = await userRepository.update(user.id, updateData);
        console.log('AuthService.loginWithGoogle: User updated');
      }
    } else {
      // Step 3b: User doesn't exist - create new user
      console.log('AuthService.loginWithGoogle: Creating new user');
      
      user = await userRepository.create({
        email: googleUser.email,
        password: null, // No password for Google users
        full_name: displayName || googleUser.name || null,
        avatar_url: googleUser.picture || null,
        auth_provider: 'google',
      });
      console.log('AuthService.loginWithGoogle: New user created with id:', user.id);
    }

    // Step 4: Generate JWT token
    const token = jwtUtils.generateToken({
      userId: user.id,
      email: user.email,
    });
    console.log('AuthService.loginWithGoogle: Token generated for userId:', user.id);

    return {
      user,
      token,
    };
  }
}

export default new AuthService();
