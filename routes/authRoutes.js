import express from 'express';
import authController from '../controllers/authController.js';
import {authenticateToken} from '../middleware/authenticateToken.js';

const router = express.Router();

// Public routes (không cần đăng nhập)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.loginWithGoogle);

// Protected routes (cần đăng nhập)
router.post('/logout', authenticateToken, authController.logout);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);

export default router;
