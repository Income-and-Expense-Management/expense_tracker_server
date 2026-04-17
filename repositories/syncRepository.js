import prisma from '../config/database.js';

/**
 * syncRepository — Data access layer for the Sync feature.
 *
 * PULL queries intentionally do NOT filter out deleted records (deleted_at != null)
 * so that the client learns which records were soft-deleted and can remove them locally.
 *
 * PUSH uses Prisma transactions to guarantee atomicity across all upsert operations.
 */
const syncRepository = {
  // ---------------------------------------------------------------------------
  // PULL — Fetch changed records since a given timestamp
  // ---------------------------------------------------------------------------

  /**
   * Fetch all wallets belonging to a user that were updated after `since`.
   * Includes soft-deleted wallets so the client can remove them locally.
   * @param {string} userId
   * @param {Date} since
   * @returns {Promise<Array>}
   */
  async getChangedWallets(userId, since) {
    return await prisma.wallet.findMany({
      where: {
        user_id: userId,
        updated_at: { gt: since },
      },
      orderBy: { updated_at: 'asc' },
    });
  },

  /**
   * Fetch all categories belonging to a user that were updated after `since`.
   * Includes soft-deleted and hidden categories so the client can sync state.
   * @param {string} userId
   * @param {Date} since
   * @returns {Promise<Array>}
   */
  async getChangedCategories(userId, since) {
    return await prisma.category.findMany({
      where: {
        user_id: userId,
        updated_at: { gt: since },
      },
      orderBy: { updated_at: 'asc' },
    });
  },

  /**
   * Fetch all transactions belonging to a user (via their wallets) updated after `since`.
   * Includes soft-deleted transactions so the client can remove them locally.
   * Uses a nested filter on wallet.user_id for ownership without a direct user_id column.
   * @param {string} userId
   * @param {Date} since
   * @returns {Promise<Array>}
   */
  async getChangedTransactions(userId, since) {
    return await prisma.transaction.findMany({
      where: {
        wallet: { user_id: userId },
        updated_at: { gt: since },
      },
      orderBy: { updated_at: 'asc' },
    });
  },

  /**
   * Fetch all budgets belonging to a user (via their wallets) updated after `since`.
   * Includes soft-deleted budgets so the client can remove them locally.
   * @param {string} userId
   * @param {Date} since
   * @returns {Promise<Array>}
   */
  async getChangedBudgets(userId, since) {
    return await prisma.budget.findMany({
      where: {
        wallet: { user_id: userId },
        updated_at: { gt: since },
      },
      orderBy: { updated_at: 'asc' },
    });
  },

  // ---------------------------------------------------------------------------
  // PUSH — Batch upsert changed records from the client
  // ---------------------------------------------------------------------------

  /**
   * Fetch existing records by their IDs in a single batch query.
   * Used to determine which client records need CREATE vs UPDATE.
   * @param {'wallet'|'category'|'transaction'|'budget'} model
   * @param {string[]} ids
   * @returns {Promise<Map<string, Object>>} Map of id → server record
   */
  async findManyByIds(model, ids) {
    const records = await prisma[model].findMany({
      where: { id: { in: ids } },
      select: { id: true, updated_at: true },
    });
    return new Map(records.map((r) => [r.id, r]));
  },

  /**
   * Execute a batch of wallet creates and updates inside a Prisma transaction.
   * @param {import('@prisma/client').PrismaClient} tx - Prisma transaction client
   * @param {Array<Object>} toCreate - Records to insert
   * @param {Array<Object>} toUpdate - Records to update (must include `id`)
   * @returns {Promise<{created: string[], updated: string[]}>}
   */
  async batchUpsertWallets(tx, toCreate, toUpdate) {
    const createOps = toCreate.map((r) =>
      tx.wallet.create({ data: r })
    );
    const updateOps = toUpdate.map(({ id, ...data }) =>
      tx.wallet.update({ where: { id }, data })
    );
    await Promise.all([...createOps, ...updateOps]);
    return {
      created: toCreate.map((r) => r.id),
      updated: toUpdate.map((r) => r.id),
    };
  },

  /**
   * Execute a batch of category creates and updates inside a Prisma transaction.
   * @param {import('@prisma/client').PrismaClient} tx
   * @param {Array<Object>} toCreate
   * @param {Array<Object>} toUpdate
   * @returns {Promise<{created: string[], updated: string[]}>}
   */
  async batchUpsertCategories(tx, toCreate, toUpdate) {
    const createOps = toCreate.map((r) =>
      tx.category.create({ data: r })
    );
    const updateOps = toUpdate.map(({ id, ...data }) =>
      tx.category.update({ where: { id }, data })
    );
    await Promise.all([...createOps, ...updateOps]);
    return {
      created: toCreate.map((r) => r.id),
      updated: toUpdate.map((r) => r.id),
    };
  },

  /**
   * Execute a batch of transaction creates and updates inside a Prisma transaction.
   * @param {import('@prisma/client').PrismaClient} tx
   * @param {Array<Object>} toCreate
   * @param {Array<Object>} toUpdate
   * @returns {Promise<{created: string[], updated: string[]}>}
   */
  async batchUpsertTransactions(tx, toCreate, toUpdate) {
    const createOps = toCreate.map((r) =>
      tx.transaction.create({ data: r })
    );
    const updateOps = toUpdate.map(({ id, ...data }) =>
      tx.transaction.update({ where: { id }, data })
    );
    await Promise.all([...createOps, ...updateOps]);
    return {
      created: toCreate.map((r) => r.id),
      updated: toUpdate.map((r) => r.id),
    };
  },

  /**
   * Execute a batch of budget creates and updates inside a Prisma transaction.
   * @param {import('@prisma/client').PrismaClient} tx
   * @param {Array<Object>} toCreate
   * @param {Array<Object>} toUpdate
   * @returns {Promise<{created: string[], updated: string[]}>}
   */
  async batchUpsertBudgets(tx, toCreate, toUpdate) {
    const createOps = toCreate.map((r) =>
      tx.budget.create({ data: r })
    );
    const updateOps = toUpdate.map(({ id, ...data }) =>
      tx.budget.update({ where: { id }, data })
    );
    await Promise.all([...createOps, ...updateOps]);
    return {
      created: toCreate.map((r) => r.id),
      updated: toUpdate.map((r) => r.id),
    };
  },

  /**
   * Execute a full push operation inside a single Prisma transaction.
   * @param {Function} callback - Receives `tx` (Prisma transaction client) and returns a result.
   * @returns {Promise<any>}
   */
  async executeTransaction(callback) {
    return await prisma.$transaction(callback);
  },
};

export default syncRepository;
