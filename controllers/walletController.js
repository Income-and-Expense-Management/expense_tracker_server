import { walletService } from '../services/walletService.js';
import ApiResponse from '../utils/responseUtils.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

const walletController = {
  async createWallet(req, res) {
    try {
      const userId = req.user.userId;
      const { name, initial_balance, currency, icon_id } = req.body;

      if (!name) {
        return ApiResponse.badRequest(res, 'Tên ví là bắt buộc');
      }

      const wallet = await walletService.createWallet(userId, {
        name,
        initial_balance,
        currency,
        icon_id,
      });

      return ApiResponse.created(res, wallet, 'Tạo ví thành công');
    } catch (error) {
      logger.error('Create wallet error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  async getWalletById(req, res) {
    try {
      const userId = req.user.userId;
      const { walletId } = req.params;

      const wallet = await walletService.getWalletById(walletId, userId);

      return ApiResponse.success(res, wallet, 'Lấy thông tin ví thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.WALLET_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.WALLET_ACCESS_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Get wallet error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  async getAllWallets(req, res) {
    try {
      const userId = req.user.userId;

      const wallets = await walletService.getAllWallets(userId);

      return ApiResponse.success(res, wallets, 'Lấy danh sách ví thành công');
    } catch (error) {
      logger.error('Get all wallets error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  async updateWallet(req, res) {
    try {
      const userId = req.user.userId;
      const { walletId } = req.params;
      const { name, initial_balance, currency, icon_id } = req.body;

      const wallet = await walletService.updateWallet(walletId, userId, {
        name,
        initial_balance,
        currency,
        icon_id,
      });

      return ApiResponse.success(res, wallet, 'Cập nhật ví thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.WALLET_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.WALLET_UPDATE_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Update wallet error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  async deleteWallet(req, res) {
    try {
      const userId = req.user.userId;
      const { walletId } = req.params;

      const result = await walletService.deleteWallet(walletId, userId);

      return ApiResponse.success(res, result, 'Xóa ví thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.WALLET_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.WALLET_DELETE_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Delete wallet error:', error);
      return ApiResponse.error(res, error.message);
    }
  },
};

export default walletController;
