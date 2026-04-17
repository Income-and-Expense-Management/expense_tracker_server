import express from 'express';
import transactionController from '../controllers/transactionController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Tất cả routes đều cần đăng nhập
router.use(authenticateToken);

// CRUD operations
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getAllTransactions);
router.get('/:transactionId', transactionController.getTransactionById);
router.put('/:transactionId', transactionController.updateTransaction);
router.delete('/:transactionId', transactionController.deleteTransaction);

// Get transactions by wallet
router.get('/wallet/:walletId', transactionController.getTransactionsByWallet);

// Get statistics for a wallet
router.get('/wallet/:walletId/statistics', transactionController.getStatistics);

export default router;
