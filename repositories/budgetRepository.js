import prisma from '../config/database.js';

const budgetRepository = {
  async create(budgetData) {
    return await prisma.budget.create({
      data: budgetData,
    });
  },

  async findById(id) {
    return await prisma.budget.findUnique({
      where: { id },
    });
  },

  async findByWalletId(walletId, filters = {}) {
    const where = { wallet_id: walletId, deleted_at: null };

    if (filters.category_id) {
      where.category_id = filters.category_id;
    }

    return await prisma.budget.findMany({
      where,
      orderBy: { start_date: 'desc' },
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
      deleted_at: null,
    };

    if (filters.wallet_id) {
      where.wallet_id = filters.wallet_id;
    }

    if (filters.category_id) {
      where.category_id = filters.category_id;
    }

    return await prisma.budget.findMany({
      where,
      orderBy: { start_date: 'desc' },
    });
  },

  async update(id, budgetData) {
    // Remove undefined values to prevent Prisma from rejecting them
    const data = Object.fromEntries(Object.entries(budgetData).filter(([_, v]) => v !== undefined));
    return await prisma.budget.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  },

  async delete(id) {
    return await prisma.budget.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  async deleteByCategoryId(categoryId) {
    return await prisma.budget.updateMany({
      where: { category_id: categoryId, deleted_at: null },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  /**
   * Get total spent (expense transactions) for a budget's wallet + category
   * within the budget's date range.
   * Uses nested Prisma filtering on category.type to identify expense transactions,
   * since Transaction no longer has a direct `type` field.
   * @param {string} walletId
   * @param {string} categoryId
   * @param {Date|null} startDate
   * @param {Date|null} endDate
   * @returns {Promise<BigInt>}
   */
  async getTotalSpent(walletId, categoryId, startDate, endDate) {
    const where = {
      wallet_id: walletId,
      category_id: categoryId,
      // Determine expense type via the linked Category (Single Source of Truth)
      category: { type: 'expense' },
    };

    if (startDate || endDate) {
      where.transaction_date = {};
      if (startDate) where.transaction_date.gte = new Date(startDate);
      if (endDate) where.transaction_date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({ where });

    let totalSpent = BigInt(0);
    transactions.forEach((trans) => {
      totalSpent += BigInt(trans.amount);
    });

    return totalSpent;
  },
};

export default budgetRepository;
