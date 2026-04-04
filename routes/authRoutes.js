const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (không cần đăng nhập)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.loginWithGoogle);

// Protected routes (cần đăng nhập)
router.post('/logout', authMiddleware, authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
