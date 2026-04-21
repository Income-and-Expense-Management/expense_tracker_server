import { transactionService } from '../services/transactionService.js';
import ApiResponse from '../utils/responseUtils.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

/**
 * Transaction controller — thin HTTP adapter for the flat /transactions endpoints.
 * Wallet-scoped transaction endpoints (getTransactionsByWallet, getStatistics,
 * createTransactionForWallet) are handled by walletController.js.
 * All field validation is done by transactionValidators.js middleware upstream.
 */
const transactionController = {
  /**
   * POST /transactions
   */
  async createTransaction(req, res) {
    try {
      const userId = req.user.userId;
      const { id, wallet_id, category_id, amount, type, transaction_date, icon_id, note } = req.body;

      const transaction = await transactionService.createTransaction(userId, {
        id,
        wallet_id,
        category_id,
        amount,
        transaction_date,
        note,
      });

      return ApiResponse.created(res, transaction, 'Tạo giao dịch thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.WALLET_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.INVALID_TRANSACTION_TYPE) {
        return ApiResponse.badRequest(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.TRANSACTION_CREATE_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Create transaction error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * GET /transactions/:transactionId
   */
  async getTransactionById(req, res) {
    try {
      const userId = req.user.userId;
      const { transactionId } = req.params;

      const transaction = await transactionService.getTransactionById(transactionId, userId);
      res.set('Cache-Control', 'no-store'); // Disable caching for dynamic user-specific data
      return ApiResponse.success(res, transaction, 'Lấy thông tin giao dịch thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.TRANSACTION_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.TRANSACTION_ACCESS_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Get transaction error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * GET /transactions
   */
  async getAllTransactions(req, res) {
    try {
      const userId = req.user.userId;
      const { type, category_id, wallet_id, start_date, end_date } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (category_id) filters.category_id = category_id;
      if (wallet_id) filters.wallet_id = wallet_id;
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;

      const transactions = await transactionService.getAllTransactions(userId, filters);
      res.set('Cache-Control', 'no-store'); // Disable caching for dynamic user-specific data

      return ApiResponse.success(res, transactions, 'Lấy danh sách giao dịch thành công');
    } catch (error) {
      logger.error('Get all transactions error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * PATCH /transactions/:transactionId
   */
  async updateTransaction(req, res) {
    try {
      const userId = req.user.userId;
      const { transactionId } = req.params;
      const { category_id, amount, transaction_date, note } = req.body;

      const transaction = await transactionService.updateTransaction(transactionId, userId, {
        category_id,
        amount,
        transaction_date,
        note,
      });

      return ApiResponse.success(res, transaction, 'Cập nhật giao dịch thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.TRANSACTION_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.TRANSACTION_UPDATE_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Update transaction error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * DELETE /transactions/:transactionId
   * Returns 204 No Content on success (REST standard for DELETE).
   */
  async deleteTransaction(req, res) {
    try {
      const userId = req.user.userId;
      const { transactionId } = req.params;

      await transactionService.deleteTransaction(transactionId, userId);

      return ApiResponse.noContent(res);
    } catch (error) {
      if (error.message === ERROR_MESSAGES.TRANSACTION_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.TRANSACTION_DELETE_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Delete transaction error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  // ---------------------------------------------------------------------------
  // Wallet-scoped handlers (called from walletRoutes.js)
  // These methods are also exported here so walletController.js can import
  // them without duplicating code.
  // ---------------------------------------------------------------------------

  /**
   * GET /wallets/:walletId/transactions (called via walletController delegation)
   */
  async getTransactionsByWallet(req, res) {
    try {
      const userId = req.user.userId;
      const { walletId } = req.params;
      const { type, category_id, start_date, end_date } = req.query;

      const filters = {};
      if (type) filters.type = type;
      if (category_id) filters.category_id = category_id;
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;

      const transactions = await transactionService.getTransactionsByWallet(
        walletId,
        userId,
        filters
      );

      return ApiResponse.success(res, transactions, 'Lấy danh sách giao dịch thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.WALLET_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.WALLET_ACCESS_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Get transactions by wallet error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * GET /wallets/:walletId/transactions/statistics (called via walletController delegation)
   */
  async getStatistics(req, res) {
    try {
      const userId = req.user.userId;
      const { walletId } = req.params;
      const { start_date, end_date } = req.query;

      const stats = await transactionService.getStatistics(walletId, userId, start_date, end_date);

      return ApiResponse.success(res, stats, 'Lấy thống kê thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.WALLET_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.WALLET_ACCESS_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Get statistics error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * POST /wallets/:walletId/transactions (called via walletRoutes.js)
   * wallet_id is injected from the URL param.
   */
  async createTransactionForWallet(req, res) {
    try {
      const userId = req.user.userId;
      const { walletId } = req.params;
      const { id, category_id, amount, type, transaction_date, icon_id, note } = req.body;

      const transaction = await transactionService.createTransaction(userId, {
        id,
        wallet_id: walletId,
        category_id,
        amount,
        type,
        transaction_date,
        icon_id,
        note,
      });

      return ApiResponse.created(res, transaction, 'Tạo giao dịch thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.WALLET_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.TRANSACTION_CREATE_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.INVALID_TRANSACTION_TYPE) {
        return ApiResponse.badRequest(res, error.message);
      }
      logger.error('Create transaction for wallet error:', error);
      return ApiResponse.error(res, error.message);
    }
  },
};

export default transactionController;
