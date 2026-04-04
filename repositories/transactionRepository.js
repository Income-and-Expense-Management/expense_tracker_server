import prisma from '../config/database.js';

class TransactionRepository {
  async create(transactionData) {
    return await prisma.transaction.create({
      data: transactionData,
    });
  }

  async findById(id) {
    return await prisma.transaction.findUnique({
      where: { id },
      include: {
        // Nếu cần thêm thông tin category
      },
    });
  }

  async findByWalletId(walletId, filters = {}) {
    const where = { wallet_id: walletId };

    if (filters.type) {
      where.type = filters.type;
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
      orderBy: { transaction_date: 'desc' },
    });
  }

  async findByUserId(userId, filters = {}) {
    const wallets = await prisma.wallet.findMany({
      where: { user_id: userId, is_active: true },
      select: { id: true },
    });

    const walletIds = wallets.map((w) => w.id);

    const where = {
      wallet_id: { in: walletIds },
    };

    if (filters.type) {
      where.type = filters.type;
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
      orderBy: { transaction_date: 'desc' },
    });
  }

  async update(id, transactionData) {
    return await prisma.transaction.update({
      where: { id },
      data: {
        ...transactionData,
        updated_at: new Date(),
      },
    });
  }

  async delete(id) {
    return await prisma.transaction.delete({
      where: { id },
    });
  }

  async getStatistics(walletId, startDate, endDate) {
    const where = {
      wallet_id: walletId,
    };

    if (startDate || endDate) {
      where.transaction_date = {};
      if (startDate) where.transaction_date.gte = new Date(startDate);
      if (endDate) where.transaction_date.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({ where });

    let totalIncome = BigInt(0);
    let totalExpense = BigInt(0);

    transactions.forEach((trans) => {
      if (trans.type === 'income') {
        totalIncome += BigInt(trans.amount);
      } else if (trans.type === 'expense') {
        totalExpense += BigInt(trans.amount);
      }
    });

    return {
      total_income: totalIncome.toString(),
      total_expense: totalExpense.toString(),
      balance: (totalIncome - totalExpense).toString(),
      transaction_count: transactions.length,
    };
  }
}

export default new TransactionRepository();
