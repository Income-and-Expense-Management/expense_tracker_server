const transactionService = require('../services/transactionService');
const responseUtils = require('../utils/responseUtils');

class TransactionController {
  async createTransaction(req, res) {
    try {
      const userId = req.user.userId;
      const { wallet_id, category_id, amount, type, transaction_date, icon_id, note } =
        req.body;

      if (!wallet_id || !amount || !type) {
        return responseUtils.badRequest(res, 'Ví, số tiền và loại giao dịch là bắt buộc');
      }

      if (amount <= 0) {
        return responseUtils.badRequest(res, 'Số tiền phải lớn hơn 0');
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

      return responseUtils.created(res, transaction, 'Tạo giao dịch thành công');
    } catch (error) {
      if (error.message.includes('Không tìm thấy ví') || error.message.includes('không hợp lệ')) {
        return responseUtils.badRequest(res, error.message);
      }
      if (error.message.includes('không có quyền')) {
        return responseUtils.forbidden(res, error.message);
      }
      console.error('Create transaction error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async getTransactionById(req, res) {
    try {
      const userId = req.user.userId;
      const { transactionId } = req.params;

      const transaction = await transactionService.getTransactionById(transactionId, userId);

      return responseUtils.success(res, transaction, 'Lấy thông tin giao dịch thành công');
    } catch (error) {
      if (error.message === 'Không tìm thấy giao dịch') {
        return responseUtils.notFound(res, error.message);
      }
      if (error.message.includes('không có quyền')) {
        return responseUtils.forbidden(res, error.message);
      }
      console.error('Get transaction error:', error);
      return responseUtils.error(res, error.message);
    }
  }

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

      return responseUtils.success(res, transactions, 'Lấy danh sách giao dịch thành công');
    } catch (error) {
      if (error.message.includes('Không tìm thấy')) {
        return responseUtils.notFound(res, error.message);
      }
      if (error.message.includes('không có quyền')) {
        return responseUtils.forbidden(res, error.message);
      }
      console.error('Get transactions by wallet error:', error);
      return responseUtils.error(res, error.message);
    }
  }

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

      return responseUtils.success(res, transactions, 'Lấy danh sách giao dịch thành công');
    } catch (error) {
      console.error('Get all transactions error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async updateTransaction(req, res) {
    try {
      const userId = req.user.userId;
      const { transactionId } = req.params;
      const { category_id, amount, type, transaction_date, icon_id, note } = req.body;

      if (amount !== undefined && amount <= 0) {
        return responseUtils.badRequest(res, 'Số tiền phải lớn hơn 0');
      }

      const transaction = await transactionService.updateTransaction(transactionId, userId, {
        category_id,
        amount,
        type,
        transaction_date,
        icon_id,
        note,
      });

      return responseUtils.success(res, transaction, 'Cập nhật giao dịch thành công');
    } catch (error) {
      if (error.message === 'Không tìm thấy giao dịch') {
        return responseUtils.notFound(res, error.message);
      }
      if (error.message.includes('không có quyền')) {
        return responseUtils.forbidden(res, error.message);
      }
      console.error('Update transaction error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async deleteTransaction(req, res) {
    try {
      const userId = req.user.userId;
      const { transactionId } = req.params;

      const result = await transactionService.deleteTransaction(transactionId, userId);

      return responseUtils.success(res, result, 'Xóa giao dịch thành công');
    } catch (error) {
      if (error.message === 'Không tìm thấy giao dịch') {
        return responseUtils.notFound(res, error.message);
      }
      if (error.message.includes('không có quyền')) {
        return responseUtils.forbidden(res, error.message);
      }
      console.error('Delete transaction error:', error);
      return responseUtils.error(res, error.message);
    }
  }

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

      return responseUtils.success(res, stats, 'Lấy thống kê thành công');
    } catch (error) {
      if (error.message.includes('Không tìm thấy')) {
        return responseUtils.notFound(res, error.message);
      }
      if (error.message.includes('không có quyền')) {
        return responseUtils.forbidden(res, error.message);
      }
      console.error('Get statistics error:', error);
      return responseUtils.error(res, error.message);
    }
  }
}

module.exports = new TransactionController();
