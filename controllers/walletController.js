const walletService = require('../services/walletService');
const responseUtils = require('../utils/responseUtils');

class WalletController {
  async createWallet(req, res) {
    try {
      const userId = req.user.userId;
      const { name, initial_balance, currency, icon_id } = req.body;

      if (!name) {
        return responseUtils.badRequest(res, 'Tên ví là bắt buộc');
      }

      const wallet = await walletService.createWallet(userId, {
        name,
        initial_balance,
        currency,
        icon_id,
      });

      return responseUtils.created(res, wallet, 'Tạo ví thành công');
    } catch (error) {
      console.error('Create wallet error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async getWalletById(req, res) {
    try {
      const userId = req.user.userId;
      const { walletId } = req.params;

      const wallet = await walletService.getWalletById(walletId, userId);

      return responseUtils.success(res, wallet, 'Lấy thông tin ví thành công');
    } catch (error) {
      if (error.message === 'Không tìm thấy ví') {
        return responseUtils.notFound(res, error.message);
      }
      if (error.message === 'Bạn không có quyền truy cập ví này') {
        return responseUtils.forbidden(res, error.message);
      }
      console.error('Get wallet error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async getAllWallets(req, res) {
    try {
      const userId = req.user.userId;

      const wallets = await walletService.getAllWallets(userId);

      return responseUtils.success(res, wallets, 'Lấy danh sách ví thành công');
    } catch (error) {
      console.error('Get all wallets error:', error);
      return responseUtils.error(res, error.message);
    }
  }

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

      return responseUtils.success(res, wallet, 'Cập nhật ví thành công');
    } catch (error) {
      if (error.message === 'Không tìm thấy ví') {
        return responseUtils.notFound(res, error.message);
      }
      if (error.message === 'Bạn không có quyền cập nhật ví này') {
        return responseUtils.forbidden(res, error.message);
      }
      console.error('Update wallet error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async deleteWallet(req, res) {
    try {
      const userId = req.user.userId;
      const { walletId } = req.params;

      const result = await walletService.deleteWallet(walletId, userId);

      return responseUtils.success(res, result, 'Xóa ví thành công');
    } catch (error) {
      if (error.message === 'Không tìm thấy ví') {
        return responseUtils.notFound(res, error.message);
      }
      if (error.message === 'Bạn không có quyền xóa ví này') {
        return responseUtils.forbidden(res, error.message);
      }
      console.error('Delete wallet error:', error);
      return responseUtils.error(res, error.message);
    }
  }
}

module.exports = new WalletController();
