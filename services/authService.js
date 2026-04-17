import userRepository from '../repositories/userRepository.js';
import { passwordUtils } from '../utils/passwordUtils.js';
import jwtUtils from '../utils/jwtUtils.js';
import googleAuthUtils from '../utils/googleAuthUtils.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

export const authService = {
  /**
   * Register a new user account with email and password.
   * @param {Object} data
   * @param {string} data.email
   * @param {string} data.password
   * @param {string} [data.full_name]
   * @param {string} [data.avatar_url]
   * @returns {Promise<{user: Object, token: string}>}
   * @throws {Error} ERROR_MESSAGES.EMAIL_ALREADY_EXISTS
   */
  async register({ email, password, full_name, avatar_url }) {
    logger.info('AuthService.register called for:', email);

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await userRepository.findByEmail(email);
    logger.debug('AuthService.register existingUser:', existingUser ? existingUser.id : null);
    if (existingUser) {
      throw new Error(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
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
    logger.info('AuthService.register created user id:', user.id);

    // Tạo JWT token (do not log the token value)
    const token = jwtUtils.generateToken({
      userId: user.id,
      email: user.email,
    });
    logger.info('AuthService.register generated token for userId:', user.id);

    return {
      user,
      token,
    };
  },

  /**
   * Login with email and password.
   * @param {Object} data
   * @param {string} data.email
   * @param {string} data.password
   * @returns {Promise<{user: Object, token: string}>}
   * @throws {Error} ERROR_MESSAGES.INVALID_CREDENTIALS
   * @throws {Error} ERROR_MESSAGES.WRONG_AUTH_PROVIDER
   */
  async login({ email, password }) {
    logger.info('AuthService.login called for:', email);

    // Tìm user theo email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Kiểm tra phương thức đăng nhập
    if (user.auth_provider === 'google' && !user.password) {
      throw new Error(ERROR_MESSAGES.WRONG_AUTH_PROVIDER);
    }

    // Xác thực mật khẩu
    const isPasswordValid = await passwordUtils.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Tạo JWT token
    const token = jwtUtils.generateToken({
      userId: user.id,
      email: user.email,
    });
    logger.info('AuthService.login generated token for userId:', user.id);

    // Trả về user info (không bao gồm password)
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  },

  /**
   * Get user profile by ID.
   * @param {string} userId
   * @returns {Promise<Object>} User profile object
   * @throws {Error} ERROR_MESSAGES.USER_NOT_FOUND
   */
  async getProfile(userId) {
    logger.info('AuthService.getProfile for userId:', userId);
    const user = await userRepository.findById(userId);
    logger.debug('AuthService.getProfile result:', user ? user.id : null);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return user;
  },

  /**
   * Update user profile (full_name, avatar_url).
   * @param {string} userId
   * @param {Object} data
   * @param {string} [data.full_name]
   * @param {string} [data.avatar_url]
   * @returns {Promise<Object>} Updated user profile
   */
  async updateProfile(userId, { full_name, avatar_url }) {
    logger.info('AuthService.updateProfile for userId:', userId);
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const user = await userRepository.update(userId, updateData);
    logger.info('AuthService.updateProfile updated user id:', user.id);
    return user;
  },

  /**
   * Change user password. Requires old password verification.
   * @param {string} userId
   * @param {Object} data
   * @param {string} data.oldPassword
   * @param {string} data.newPassword
   * @returns {Promise<{message: string}>}
   * @throws {Error} ERROR_MESSAGES.WRONG_OLD_PASSWORD
   */
  async changePassword(userId, { oldPassword, newPassword }) {
    logger.info('AuthService.changePassword for userId:', userId);
    // Use findByIdWithPassword to fetch the password hash in a single query
    const user = await userRepository.findByIdWithPassword(userId);
    logger.debug('AuthService.changePassword found user:', user ? user.id : null);

    // Kiểm tra mật khẩu cũ (do NOT log plaintext passwords)
    const isPasswordValid = await passwordUtils.comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error(ERROR_MESSAGES.WRONG_OLD_PASSWORD);
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await passwordUtils.hashPassword(newPassword);

    // Cập nhật mật khẩu
    await userRepository.update(userId, { password: hashedPassword });
    logger.info('AuthService.changePassword updated password for userId:', userId);

    return { message: 'Đổi mật khẩu thành công' };
  },

  /**
   * Login or register with Google OAuth ID token.
   * @param {Object} data
   * @param {string} data.idToken - Google ID token
   * @param {string} [data.displayName]
   * @param {string} data.email
   * @returns {Promise<{user: Object, token: string}>}
   * @throws {Error} ERROR_MESSAGES.INVALID_GOOGLE_TOKEN
   */
  async loginWithGoogle({ idToken, displayName, email }) {
    logger.info('AuthService.loginWithGoogle called for email:', email);

    // Step 1: Verify Google ID token
    let googleUser;
    try {
      // Try lenient verification (handles Android vs Web client ID mismatch)
      googleUser = await googleAuthUtils.verifyGoogleTokenLenient(idToken, email);
      logger.info('AuthService.loginWithGoogle: Token verified, googleId:', googleUser.googleId);
    } catch (error) {
      logger.error('AuthService.loginWithGoogle: Token verification failed:', error.message);
      throw new Error(ERROR_MESSAGES.INVALID_GOOGLE_TOKEN);
    }

    // Step 2: Check if user exists
    let user = await userRepository.findByEmail(googleUser.email);
    logger.debug('AuthService.loginWithGoogle: Existing user:', user ? user.id : 'not found');

    if (user) {
      // Step 3a: User exists - update info if needed
      logger.debug('AuthService.loginWithGoogle: Updating existing user');
      
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
        logger.debug('AuthService.loginWithGoogle: User has local auth, keeping both methods');
      } else if (user.auth_provider !== 'google') {
        updateData.auth_provider = 'google';
      }

      if (Object.keys(updateData).length > 0) {
        user = await userRepository.update(user.id, updateData);
        logger.info('AuthService.loginWithGoogle: User updated');
      }
    } else {
      // Step 3b: User doesn't exist - create new user
      logger.info('AuthService.loginWithGoogle: Creating new user');
      
      user = await userRepository.create({
        email: googleUser.email,
        password: null, // No password for Google users
        full_name: displayName || googleUser.name || null,
        avatar_url: googleUser.picture || null,
        auth_provider: 'google',
      });
      logger.info('AuthService.loginWithGoogle: New user created with id:', user.id);
    }

    // Step 4: Generate JWT token
    const token = jwtUtils.generateToken({
      userId: user.id,
      email: user.email,
    });
    logger.info('AuthService.loginWithGoogle: Token generated for userId:', user.id);

    return {
      user,
      token,
    };
  },
};

export default authService;
