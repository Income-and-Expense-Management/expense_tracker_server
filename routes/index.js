import express from 'express';
import authRoutes from './authRoutes.js';
import walletRoutes from './walletRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import categoryRoutes from './categoryRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/wallets', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/categories', categoryRoutes);

export default router;
