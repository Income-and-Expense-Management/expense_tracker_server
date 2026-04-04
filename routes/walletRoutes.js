import express from 'express';
import walletController from '../controllers/walletController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(authMiddleware);

// CRUD operations
router.post('/', walletController.createWallet);
router.get('/', walletController.getAllWallets);
router.get('/:walletId', walletController.getWalletById);
router.put('/:walletId', walletController.updateWallet);
router.delete('/:walletId', walletController.deleteWallet);

export default router;
