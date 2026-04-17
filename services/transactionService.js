import transactionRepository from '../repositories/transactionRepository.js';
import walletRepository from '../repositories/walletRepository.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

export const transactionService = {
  /**
   * Create a new transaction for a wallet with ownership check.
   * @param {string} userId - Requesting user ID
   * @param {Object} transactionData
   * @param {string} transactionData.wallet_id - Target wallet ID
   * @param {string} [transactionData.category_id] - Category ID
   * @param {number|string} transactionData.amount - Transaction amount
   * @param {string} transactionData.type - 'income' or 'expense'
   * @param {string} [transactionData.transaction_date] - ISO date string
   * @param {string} [transactionData.icon_id] - Icon identifier
   * @param {string} [transactionData.note] - Transaction note
   * @returns {Promise<Object>} Created transaction with amount as string
   * @throws {Error} ERROR_MESSAGES.WALLET_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.TRANSACTION_CREATE_DENIED
   * @throws {Error} ERROR_MESSAGES.INVALID_TRANSACTION_TYPE
   */
  async createTransaction(userId, transactionData) {
    logger.info('TransactionService.createTransaction for userId:', userId);
    const {
      wallet_id,
      category_id,
      amount,
      type,
      transaction_date,
      icon_id,
      note,
    } = transactionData;

    const wallet = await walletRepository.findById(wallet_id);
    if (!wallet) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_FOUND);
    }

    if (wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.TRANSACTION_CREATE_DENIED);
    }

    if (!['income', 'expense'].includes(type)) {
      throw new Error(ERROR_MESSAGES.INVALID_TRANSACTION_TYPE);
    }

    const newTransaction = await transactionRepository.create({
      wallet_id,
      category_id: category_id || null,
      amount: BigInt(amount),
      type,
      transaction_date: transaction_date ? new Date(transaction_date) : new Date(),
      icon_id,
      note,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return {
      ...newTransaction,
      amount: newTransaction.amount.toString(),
    };
  },

  /**
   * Get a transaction by ID with ownership check via wallet.
   * @param {string} transactionId - Transaction ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<Object>} Transaction with amount as string
   * @throws {Error} ERROR_MESSAGES.TRANSACTION_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.TRANSACTION_ACCESS_DENIED
   */
  async getTransactionById(transactionId, userId) {
    logger.info('TransactionService.getTransactionById:', transactionId);
    const transaction = await transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new Error(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    }

    const wallet = await walletRepository.findById(transaction.wallet_id);
    if (wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.TRANSACTION_ACCESS_DENIED);
    }

    return {
      ...transaction,
      amount: transaction.amount.toString(),
    };
  },

  /**
   * Get all transactions for a wallet with ownership check and optional filters.
   * @param {string} walletId - Wallet ID
   * @param {string} userId - Requesting user ID
   * @param {Object} [filters={}] - Optional filters
   * @param {string} [filters.type] - 'income' or 'expense'
   * @param {string} [filters.category_id]
   * @param {string} [filters.start_date] - ISO date string
   * @param {string} [filters.end_date] - ISO date string
   * @returns {Promise<Array<Object>>} Transactions with amounts as strings
   * @throws {Error} ERROR_MESSAGES.WALLET_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.WALLET_ACCESS_DENIED
   */
  async getTransactionsByWallet(walletId, userId, filters = {}) {
    logger.info('TransactionService.getTransactionsByWallet:', walletId);
    const wallet = await walletRepository.findById(walletId);
    if (!wallet) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_FOUND);
    }

    if (wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.WALLET_ACCESS_DENIED);
    }

    const transactions = await transactionRepository.findByWalletId(walletId, filters);

    return transactions.map((trans) => ({
      ...trans,
      amount: trans.amount.toString(),
    }));
  },

  /**
   * Get all transactions for a user across all wallets with optional filters.
   * @param {string} userId - Owner user ID
   * @param {Object} [filters={}] - Optional filters
   * @param {string} [filters.type] - 'income' or 'expense'
   * @param {string} [filters.category_id]
   * @param {string} [filters.wallet_id]
   * @param {string} [filters.start_date] - ISO date string
   * @param {string} [filters.end_date] - ISO date string
   * @returns {Promise<Array<Object>>} Transactions with amounts as strings
   */
  async getAllTransactions(userId, filters = {}) {
    logger.info('TransactionService.getAllTransactions for userId:', userId);
    const transactions = await transactionRepository.findByUserId(userId, filters);

    return transactions.map((trans) => ({
      ...trans,
      amount: trans.amount.toString(),
    }));
  },

  /**
   * Update a transaction with ownership check.
   * @param {string} transactionId - Transaction ID
   * @param {string} userId - Requesting user ID
   * @param {Object} transactionData - Fields to update
   * @param {string} [transactionData.category_id]
   * @param {number|string} [transactionData.amount]
   * @param {string} [transactionData.type]
   * @param {string} [transactionData.transaction_date]
   * @param {string} [transactionData.icon_id]
   * @param {string} [transactionData.note]
   * @returns {Promise<Object>} Updated transaction with amount as string
   * @throws {Error} ERROR_MESSAGES.TRANSACTION_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.TRANSACTION_UPDATE_DENIED
   */
  async updateTransaction(transactionId, userId, transactionData) {
    logger.info('TransactionService.updateTransaction:', transactionId);
    const transaction = await transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new Error(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    }

    const wallet = await walletRepository.findById(transaction.wallet_id);
    if (wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.TRANSACTION_UPDATE_DENIED);
    }

    const updateData = {};
    if (transactionData.category_id !== undefined) {
      updateData.category_id = transactionData.category_id;
    }
    if (transactionData.amount !== undefined) {
      updateData.amount = BigInt(transactionData.amount);
    }
    if (transactionData.type) updateData.type = transactionData.type;
    if (transactionData.transaction_date) {
      updateData.transaction_date = new Date(transactionData.transaction_date);
    }
    if (transactionData.icon_id !== undefined) {
      updateData.icon_id = transactionData.icon_id;
    }
    if (transactionData.note !== undefined) {
      updateData.note = transactionData.note;
    }

    const updatedTransaction = await transactionRepository.update(transactionId, updateData);

    return {
      ...updatedTransaction,
      amount: updatedTransaction.amount.toString(),
    };
  },

  /**
   * Delete a transaction with ownership check.
   * @param {string} transactionId - Transaction ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<{message: string}>}
   * @throws {Error} ERROR_MESSAGES.TRANSACTION_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.TRANSACTION_DELETE_DENIED
   */
  async deleteTransaction(transactionId, userId) {
    logger.info('TransactionService.deleteTransaction:', transactionId);
    const transaction = await transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new Error(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    }

    const wallet = await walletRepository.findById(transaction.wallet_id);
    if (wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.TRANSACTION_DELETE_DENIED);
    }

    await transactionRepository.delete(transactionId);

    return { message: 'Xóa giao dịch thành công' };
  },

  /**
   * Get income/expense statistics for a wallet with ownership check.
   * @param {string} walletId - Wallet ID
   * @param {string} userId - Requesting user ID
   * @param {string} [startDate] - ISO date string
   * @param {string} [endDate] - ISO date string
   * @returns {Promise<Object>} Statistics with total_income, total_expense, balance, transaction_count
   * @throws {Error} ERROR_MESSAGES.WALLET_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.WALLET_ACCESS_DENIED
   */
  async getStatistics(walletId, userId, startDate, endDate) {
    logger.info('TransactionService.getStatistics for walletId:', walletId);
    const wallet = await walletRepository.findById(walletId);
    if (!wallet) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_FOUND);
    }

    if (wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.WALLET_ACCESS_DENIED);
    }

    const stats = await transactionRepository.getStatistics(walletId, startDate, endDate);

    return stats;
  },
};

export default transactionService;
