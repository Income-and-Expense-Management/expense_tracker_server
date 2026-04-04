const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class WalletRepository {
  async create(walletData) {
    return await prisma.wallet.create({
      data: walletData,
    });
  }

  async findById(id) {
    return await prisma.wallet.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId) {
    return await prisma.wallet.findMany({
      where: { 
        user_id: userId,
        is_active: true
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async update(id, walletData) {
    return await prisma.wallet.update({
      where: { id },
      data: {
        ...walletData,
        updated_at: new Date(),
      },
    });
  }

  async softDelete(id) {
    return await prisma.wallet.update({
      where: { id },
      data: { 
        is_active: false,
        updated_at: new Date(),
      },
    });
  }

  async delete(id) {
    return await prisma.wallet.delete({
      where: { id },
    });
  }

  async getWalletBalance(walletId) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) return null;

    const transactions = await prisma.transaction.findMany({
      where: { wallet_id: walletId },
    });

    let currentBalance = BigInt(wallet.initial_balance || 0);

    transactions.forEach((trans) => {
      if (trans.type === 'income') {
        currentBalance += BigInt(trans.amount);
      } else if (trans.type === 'expense') {
        currentBalance -= BigInt(trans.amount);
      }
    });

    return {
      ...wallet,
      current_balance: currentBalance.toString(),
    };
  }
}

module.exports = new WalletRepository();
