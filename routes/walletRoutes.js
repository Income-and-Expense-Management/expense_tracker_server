import express from 'express';
import walletController from '../controllers/walletController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(authenticateToken);

// CRUD operations
router.post('/', walletController.createWallet);
router.get('/', walletController.getAllWallets);
router.get('/:walletId', walletController.getWalletById);
router.put('/:walletId', walletController.updateWallet);
router.delete('/:walletId', walletController.deleteWallet);

export default router;
