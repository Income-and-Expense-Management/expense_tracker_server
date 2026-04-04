const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');

// Tất cả routes đều cần đăng nhập
router.use(authMiddleware);

// CRUD operations
router.post('/', walletController.createWallet);
router.get('/', walletController.getAllWallets);
router.get('/:walletId', walletController.getWalletById);
router.put('/:walletId', walletController.updateWallet);
router.delete('/:walletId', walletController.deleteWallet);

module.exports = router;
