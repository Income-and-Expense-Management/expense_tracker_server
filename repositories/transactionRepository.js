import prisma from '../config/database.js';

const transactionRepository = {
  async create(transactionData) {
    return await prisma.transaction.create({
      data: transactionData,
      include: { category: true },
    });
  },

  async findById(id) {
    return await prisma.transaction.findUnique({
      where: { id },
      include: { category: true },
    });
  },

  async findByWalletId(walletId, filters = {}) {
    const where = { wallet_id: walletId };

    // Filter by type via the linked category (Single Source of Truth)
    if (filters.type) {
      where.category = { type: filters.type };
    }

    if (filters.category_id) {
      where.category_id = filters.category_id;
    }

    if (filters.start_date || filters.end_date) {
      where.transaction_date = {};
      if (filters.start_date) {
        where.transaction_date.gte = new Date(filters.start_date);
      }
      if (filters.end_date) {
        where.transaction_date.lte = new Date(filters.end_date);
      }
    }

    return await prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { transaction_date: 'desc' },
    });
  },

  async findByUserId(userId, filters = {}) {
    // Fetch only non-deleted wallet IDs belonging to this user
    const wallets = await prisma.wallet.findMany({
      where: { user_id: userId, deleted_at: null },
      select: { id: true },
    });

    const walletIds = wallets.map((w) => w.id);

    const where = {
      wallet_id: { in: walletIds },
    };

    // Filter by type via the linked category (Single Source of Truth)
    if (filters.type) {
      where.category = { type: filters.type };
    }

    if (filters.category_id) {
      where.category_id = filters.category_id;
    }

    if (filters.wallet_id) {
      where.wallet_id = filters.wallet_id;
    }

    if (filters.start_date || filters.end_date) {
      where.transaction_date = {};
      if (filters.start_date) {
        where.transaction_date.gte = new Date(filters.start_date);
      }
      if (filters.end_date) {
        where.transaction_date.lte = new Date(filters.end_date);
      }
    }

    return await prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { transaction_date: 'desc' },
    });
  },

  async update(id, transactionData) {
    return await prisma.transaction.update({
      where: { id },
      data: {
        ...transactionData,
        updated_at: new Date(),
      },
      include: { category: true },
    });
  },

  async delete(id) {
    return await prisma.transaction.delete({
      where: { id },
    });
  },

  /**
   * Compute income/expense statistics for a wallet within an optional date range.
   * Transaction type (income/expense) is derived from the linked Category.type.
   * Transactions without a category are counted in transaction_count but excluded
   * from income/expense totals.
   * @param {string} walletId
   * @param {string|null} [startDate] - ISO date string
   * @param {string|null} [endDate] - ISO date string
   * @returns {Promise<{total_income: string, total_expense: string, balance: string, transaction_count: number}>}
   */
  async getStatistics(walletId, startDate, endDate) {
    const where = {
      wallet_id: walletId,
    };

    if (startDate || endDate) {
      where.transaction_date = {};
      if (startDate) where.transaction_date.gte = new Date(startDate);
      if (endDate) where.transaction_date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
    });

    let totalIncome = BigInt(0);
    let totalExpense = BigInt(0);

    transactions.forEach((trans) => {
      const categoryType = trans.category?.type;
      if (categoryType === 'income') {
        totalIncome += BigInt(trans.amount);
      } else if (categoryType === 'expense') {
        totalExpense += BigInt(trans.amount);
      }
    });

    return {
      total_income: totalIncome.toString(),
      total_expense: totalExpense.toString(),
      balance: (totalIncome - totalExpense).toString(),
      transaction_count: transactions.length,
    };
  },
};

export default transactionRepository;
