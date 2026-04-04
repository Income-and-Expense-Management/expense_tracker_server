import walletRepository from '../repositories/walletRepository.js';

class WalletService {
  async createWallet(userId, walletData) {
    const { name, initial_balance, currency, icon_id } = walletData;

    const newWallet = await walletRepository.create({
      user_id: userId,
      name,
      initial_balance: initial_balance ? BigInt(initial_balance) : BigInt(0),
      currency: currency || 'VND',
      icon_id,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
    });

    return {
      ...newWallet,
      initial_balance: newWallet.initial_balance.toString(),
    };
  }

  async getWalletById(walletId, userId) {
    const wallet = await walletRepository.findById(walletId);

    if (!wallet) {
      throw new Error('Không tìm thấy ví');
    }

    if (wallet.user_id !== userId) {
      throw new Error('Bạn không có quyền truy cập ví này');
    }

    const walletWithBalance = await walletRepository.getWalletBalance(walletId);

    return {
      ...walletWithBalance,
      initial_balance: walletWithBalance.initial_balance.toString(),
      current_balance: walletWithBalance.current_balance,
    };
  }

  async getAllWallets(userId) {
    const wallets = await walletRepository.findByUserId(userId);

    const walletsWithBalance = await Promise.all(
      wallets.map(async (wallet) => {
        const walletWithBalance = await walletRepository.getWalletBalance(wallet.id);
        return {
          ...walletWithBalance,
          initial_balance: walletWithBalance.initial_balance.toString(),
          current_balance: walletWithBalance.current_balance,
        };
      })
    );

    return walletsWithBalance;
  }

  async updateWallet(walletId, userId, walletData) {
    const wallet = await walletRepository.findById(walletId);

    if (!wallet) {
      throw new Error('Không tìm thấy ví');
    }

    if (wallet.user_id !== userId) {
      throw new Error('Bạn không có quyền cập nhật ví này');
    }

    const updateData = {};
    if (walletData.name) updateData.name = walletData.name;
    if (walletData.initial_balance !== undefined) {
      updateData.initial_balance = BigInt(walletData.initial_balance);
    }
    if (walletData.currency) updateData.currency = walletData.currency;
    if (walletData.icon_id) updateData.icon_id = walletData.icon_id;

    const updatedWallet = await walletRepository.update(walletId, updateData);

    return {
      ...updatedWallet,
      initial_balance: updatedWallet.initial_balance.toString(),
    };
  }

  async deleteWallet(walletId, userId) {
    const wallet = await walletRepository.findById(walletId);

    if (!wallet) {
      throw new Error('Không tìm thấy ví');
    }

    if (wallet.user_id !== userId) {
      throw new Error('Bạn không có quyền xóa ví này');
    }

    await walletRepository.softDelete(walletId);

    return { message: 'Xóa ví thành công' };
  }
}

export default new WalletService();
