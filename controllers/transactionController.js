import { transactionService } from '../services/transactionService.js';
import ApiResponse from '../utils/responseUtils.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

const transactionController = {
  async createTransaction(req, res) {
    try {
      const userId = req.user.userId;
      const { wallet_id, category_id, amount, type, transaction_date, icon_id, note } =
        req.body;

      if (!wallet_id || !amount || !type) {
        return ApiResponse.badRequest(res, 'Ví, số tiền và loại giao dịch là bắt buộc');
      }

      if (amount <= 0) {
        return ApiResponse.badRequest(res, 'Số tiền phải lớn hơn 0');
      }

      const transaction = await transactionService.createTransaction(userId, {
        wallet_id,
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

  async getTransactionById(req, res) {
    try {
      const userId = req.user.userId;
      const { transactionId } = req.params;

      const transaction = await transactionService.getTransactionById(transactionId, userId);

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

      return ApiResponse.success(res, transactions, 'Lấy danh sách giao dịch thành công');
    } catch (error) {
      logger.error('Get all transactions error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  async updateTransaction(req, res) {
    try {
      const userId = req.user.userId;
      const { transactionId } = req.params;
      const { category_id, amount, type, transaction_date, icon_id, note } = req.body;

      if (amount !== undefined && amount <= 0) {
        return ApiResponse.badRequest(res, 'Số tiền phải lớn hơn 0');
      }

      const transaction = await transactionService.updateTransaction(transactionId, userId, {
        category_id,
        amount,
        type,
        transaction_date,
        icon_id,
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

  async deleteTransaction(req, res) {
    try {
      const userId = req.user.userId;
      const { transactionId } = req.params;

      const result = await transactionService.deleteTransaction(transactionId, userId);

      return ApiResponse.success(res, result, 'Xóa giao dịch thành công');
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

  async getStatistics(req, res) {
    try {
      const userId = req.user.userId;
      const { walletId } = req.params;
      const { start_date, end_date } = req.query;

      const stats = await transactionService.getStatistics(
        walletId,
        userId,
        start_date,
        end_date
      );

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
};

export default transactionController;
