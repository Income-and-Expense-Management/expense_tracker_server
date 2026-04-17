import express from 'express';
import walletController from '../controllers/walletController.js';
import transactionController from '../controllers/transactionController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import {
  validateCreateWallet,
  validateUpdateWallet,
} from '../middleware/validators/walletValidators.js';
import { validateCreateTransaction } from '../middleware/validators/transactionValidators.js';

const router = express.Router();

// All wallet routes require authentication
router.use(authenticateToken);

// Wallet CRUD
router.post('/',           validateCreateWallet,  walletController.createWallet);
router.get('/',                                   walletController.getAllWallets);
router.get('/:walletId',                          walletController.getWalletById);
router.patch('/:walletId', validateUpdateWallet,  walletController.updateWallet);
router.delete('/:walletId',                       walletController.deleteWallet);

// Nested transaction routes — REST standard: /wallets/:walletId/transactions
// (Moved from /transactions/wallet/:walletId to enforce proper resource nesting per REST §1)
router.post('/:walletId/transactions',           validateCreateTransaction, transactionController.createTransactionForWallet);
router.get('/:walletId/transactions',            transactionController.getTransactionsByWallet);
router.get('/:walletId/transactions/statistics', transactionController.getStatistics);

export default router;
