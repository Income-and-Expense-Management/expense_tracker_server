import walletRepository from '../repositories/walletRepository.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

export const walletService = {
  /**
   * Create a new wallet for a user.
   * @param {string} userId - Owner user ID
   * @param {Object} walletData
   * @param {string} walletData.name - Wallet name
   * @param {number|string} [walletData.initial_balance=0] - Initial balance
   * @param {string} [walletData.currency='VND'] - Currency code
   * @param {string} [walletData.icon_id] - Icon identifier
   * @returns {Promise<Object>} Created wallet with initial_balance as string
   */
  async createWallet(userId, walletData) {
    logger.info('WalletService.createWallet for userId:', userId);
    const { id, name, initial_balance, currency, icon_id } = walletData;

    const newWallet = await walletRepository.create({
      ...(id && { id }),
      user_id: userId,
      name,
      initial_balance: initial_balance ? BigInt(initial_balance) : BigInt(0),
      currency: currency || 'VND',
      icon_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return {
      ...newWallet,
      initial_balance: newWallet.initial_balance.toString(),
    };
  },

  /**
   * Get a wallet by ID with ownership check and computed balance.
   * @param {string} walletId - Wallet ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<Object>} Wallet with initial_balance and current_balance as strings
   * @throws {Error} ERROR_MESSAGES.WALLET_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.WALLET_ACCESS_DENIED
   */
  async getWalletById(walletId, userId) {
    logger.info('WalletService.getWalletById:', walletId);
    const wallet = await walletRepository.findById(walletId);

    if (!wallet) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_FOUND);
    }

    if (wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.WALLET_ACCESS_DENIED);
    }

    const walletWithBalance = await walletRepository.getWalletBalance(walletId);

    return {
      ...walletWithBalance,
      initial_balance: walletWithBalance.initial_balance.toString(),
      current_balance: walletWithBalance.current_balance,
    };
  },

  /**
   * Get all wallets for a user with computed balances.
   * @param {string} userId - Owner user ID
   * @returns {Promise<Array<Object>>} Array of wallets with balances as strings
   */
  async getAllWallets(userId) {
    logger.info('WalletService.getAllWallets for userId:', userId);
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
  },

  /**
   * Update a wallet with ownership check.
   * @param {string} walletId - Wallet ID
   * @param {string} userId - Requesting user ID
   * @param {Object} walletData - Fields to update
   * @param {string} [walletData.name]
   * @param {number|string} [walletData.initial_balance]
   * @param {string} [walletData.currency]
   * @param {string} [walletData.icon_id]
   * @returns {Promise<Object>} Updated wallet with initial_balance as string
   * @throws {Error} ERROR_MESSAGES.WALLET_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.WALLET_UPDATE_DENIED
   */
  async updateWallet(walletId, userId, walletData) {
    logger.info('WalletService.updateWallet:', walletId);
    const wallet = await walletRepository.findById(walletId);

    if (!wallet) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_FOUND);
    }

    if (wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.WALLET_UPDATE_DENIED);
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
  },

  /**
   * Soft-delete a wallet with ownership check.
   * @param {string} walletId - Wallet ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<{message: string}>}
   * @throws {Error} ERROR_MESSAGES.WALLET_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.WALLET_DELETE_DENIED
   */
  async deleteWallet(walletId, userId) {
    logger.info('WalletService.deleteWallet:', walletId);
    const wallet = await walletRepository.findById(walletId);

    if (!wallet) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_FOUND);
    }

    if (wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.WALLET_DELETE_DENIED);
    }

    await walletRepository.softDelete(walletId);

    return { message: 'Xóa ví thành công' };
  },
};

export default walletService;
