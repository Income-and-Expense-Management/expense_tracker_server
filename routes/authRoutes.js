import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import {
  validateRegister,
  validateLogin,
  validateGoogleLogin,
  validateUpdateProfile,
  validateChangePassword,
} from '../middleware/validators/authValidators.js';

const router = express.Router();

// Public routes (không cần đăng nhập)
router.post('/register', validateRegister,     authController.register);
router.post('/login',    validateLogin,        authController.login);
router.post('/google',   validateGoogleLogin,  authController.loginWithGoogle);

// Protected routes (cần đăng nhập)
router.post('/logout',           authenticateToken,                              authController.logout);
router.get('/profile',           authenticateToken,                              authController.getProfile);
router.patch('/profile',         authenticateToken, validateUpdateProfile,       authController.updateProfile);
router.patch('/change-password', authenticateToken, validateChangePassword,      authController.changePassword);

export default router;
