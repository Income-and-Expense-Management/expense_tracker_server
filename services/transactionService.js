import transactionRepository from '../repositories/transactionRepository.js';
import walletRepository from '../repositories/walletRepository.js';

class TransactionService {
  async createTransaction(userId, transactionData) {
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
      throw new Error('Không tìm thấy ví');
    }

    if (wallet.user_id !== userId) {
      throw new Error('Bạn không có quyền tạo giao dịch cho ví này');
    }

    if (!['income', 'expense'].includes(type)) {
      throw new Error('Loại giao dịch không hợp lệ');
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
  }

  async getTransactionById(transactionId, userId) {
    const transaction = await transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new Error('Không tìm thấy giao dịch');
    }

    const wallet = await walletRepository.findById(transaction.wallet_id);
    if (wallet.user_id !== userId) {
      throw new Error('Bạn không có quyền truy cập giao dịch này');
    }

    return {
      ...transaction,
      amount: transaction.amount.toString(),
    };
  }

  async getTransactionsByWallet(walletId, userId, filters = {}) {
    const wallet = await walletRepository.findById(walletId);
    if (!wallet) {
      throw new Error('Không tìm thấy ví');
    }

    if (wallet.user_id !== userId) {
      throw new Error('Bạn không có quyền truy cập ví này');
    }

    const transactions = await transactionRepository.findByWalletId(walletId, filters);

    return transactions.map((trans) => ({
      ...trans,
      amount: trans.amount.toString(),
    }));
  }

  async getAllTransactions(userId, filters = {}) {
    const transactions = await transactionRepository.findByUserId(userId, filters);

    return transactions.map((trans) => ({
      ...trans,
      amount: trans.amount.toString(),
    }));
  }

  async updateTransaction(transactionId, userId, transactionData) {
    const transaction = await transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new Error('Không tìm thấy giao dịch');
    }

    const wallet = await walletRepository.findById(transaction.wallet_id);
    if (wallet.user_id !== userId) {
      throw new Error('Bạn không có quyền cập nhật giao dịch này');
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
  }

  async deleteTransaction(transactionId, userId) {
    const transaction = await transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new Error('Không tìm thấy giao dịch');
    }

    const wallet = await walletRepository.findById(transaction.wallet_id);
    if (wallet.user_id !== userId) {
      throw new Error('Bạn không có quyền xóa giao dịch này');
    }

    await transactionRepository.delete(transactionId);

    return { message: 'Xóa giao dịch thành công' };
  }

  async getStatistics(walletId, userId, startDate, endDate) {
    const wallet = await walletRepository.findById(walletId);
    if (!wallet) {
      throw new Error('Không tìm thấy ví');
    }

    if (wallet.user_id !== userId) {
      throw new Error('Bạn không có quyền truy cập ví này');
    }

    const stats = await transactionRepository.getStatistics(walletId, startDate, endDate);

    return stats;
  }
}

export default new TransactionService();
