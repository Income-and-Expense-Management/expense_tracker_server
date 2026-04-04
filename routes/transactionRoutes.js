const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

// Tất cả routes đều cần đăng nhập
router.use(authMiddleware);

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

module.exports = router;
