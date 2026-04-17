import express from 'express';
import prisma from '../config/database.js';
import ApiResponse from '../utils/responseUtils.js';
import authRoutes from './authRoutes.js';
import walletRoutes from './walletRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import budgetRoutes from './budgetRoutes.js';

const router = express.Router();

// Health check endpoint (public, no auth required)
router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  return ApiResponse.success(res, {
    service: 'QLCT API',
    version: '1.0.0',
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  }, 'Service is running normally');
});

// API v1 sub-router
const v1Router = express.Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/wallets', walletRoutes);
v1Router.use('/transactions', transactionRoutes);
v1Router.use('/categories', categoryRoutes);
v1Router.use('/budgets', budgetRoutes);

// Mount v1 under /v1 prefix
router.use('/v1', v1Router);

export default router;
