import express from 'express';
import transactionController from '../controllers/transactionController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import {
  validateCreateTransaction,
  validateUpdateTransaction,
} from '../middleware/validators/transactionValidators.js';

const router = express.Router();

// All transaction routes require authentication
router.use(authenticateToken);

// Transaction CRUD (flat resource — user-wide)
// NOTE: wallet-scoped transaction endpoints live under /wallets/:walletId/transactions
//       (see walletRoutes.js) to enforce proper REST nesting.
router.post('/',                validateCreateTransaction,  transactionController.createTransaction);
router.get('/',                                             transactionController.getAllTransactions);
router.get('/:transactionId',                               transactionController.getTransactionById);
router.patch('/:transactionId', validateUpdateTransaction,  transactionController.updateTransaction);
router.delete('/:transactionId',                            transactionController.deleteTransaction);

export default router;
