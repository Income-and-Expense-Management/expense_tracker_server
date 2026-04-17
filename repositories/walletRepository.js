import prisma from '../config/database.js';

const walletRepository = {
  async create(walletData) {
    return await prisma.wallet.create({
      data: walletData,
    });
  },

  async findById(id) {
    return await prisma.wallet.findUnique({
      where: { id },
    });
  },

  async findByUserId(userId) {
    return await prisma.wallet.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
    });
  },

  async update(id, walletData) {
    return await prisma.wallet.update({
      where: { id },
      data: {
        ...walletData,
        updated_at: new Date(),
      },
    });
  },

  async softDelete(id) {
    return await prisma.wallet.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  async delete(id) {
    return await prisma.wallet.delete({
      where: { id },
    });
  },

  /**
   * Compute the real-time balance of a wallet.
   * Balance = initial_balance + SUM(income transactions) - SUM(expense transactions).
   * Transaction type is inferred from its linked Category.type.
   * Transactions without a category (category_id = null) are excluded from the calculation.
   * @param {string} walletId
   * @returns {Promise<Object|null>} wallet + current_balance (String), or null if not found.
   */
  async getWalletBalance(walletId) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) return null;

    const transactions = await prisma.transaction.findMany({
      where: { wallet_id: walletId },
      include: { category: true },
    });

    let currentBalance = BigInt(wallet.initial_balance || 0);

    transactions.forEach((trans) => {
      const categoryType = trans.category?.type;
      if (categoryType === 'income') {
        currentBalance += BigInt(trans.amount);
      } else if (categoryType === 'expense') {
        currentBalance -= BigInt(trans.amount);
      }
    });

    return {
      ...wallet,
      current_balance: currentBalance.toString(),
    };
  },
};

export default walletRepository;
