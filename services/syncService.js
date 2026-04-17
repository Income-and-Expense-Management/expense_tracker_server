import syncRepository from '../repositories/syncRepository.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Helpers — BigInt serialization
// ---------------------------------------------------------------------------

/**
 * Serialize BigInt fields in a single record to strings.
 * Covers all known BigInt columns across all syncable models.
 * @param {Object} record
 * @returns {Object}
 */
function serializeRecord(record) {
  const result = { ...record };
  if (result.initial_balance != null) result.initial_balance = result.initial_balance.toString();
  if (result.amount != null) result.amount = result.amount.toString();
  if (result.target_amount != null) result.target_amount = result.target_amount.toString();
  return result;
}

/**
 * Serialize an array of records, converting all BigInt fields to strings.
 * @param {Array<Object>} records
 * @returns {Array<Object>}
 */
function serializeRecords(records) {
  return records.map(serializeRecord);
}

// ---------------------------------------------------------------------------
// Push helpers — conflict resolution & data sanitization
// ---------------------------------------------------------------------------

/**
 * Clamp `amount`-like client-specified BigInt fields before upserting.
 * This also converts string BigInt representations sent by the client into proper
 * JavaScript BigInt values that Prisma expects.
 * @param {Object} record - Raw client record
 * @param {'wallet'|'category'|'transaction'|'budget'} model
 * @returns {Object} Record with BigInt fields properly typed
 */
function deserializeClientRecord(record, model) {
  const r = { ...record };
  if (model === 'wallet' && r.initial_balance != null) {
    r.initial_balance = BigInt(r.initial_balance);
  }
  if (model === 'transaction' && r.amount != null) {
    r.amount = BigInt(r.amount);
  }
  if (model === 'budget' && r.target_amount != null) {
    r.target_amount = BigInt(r.target_amount);
  }
  // Normalize date fields: ensure `updated_at` and `deleted_at` are Date objects
  if (r.updated_at != null) r.updated_at = new Date(r.updated_at);
  if (r.deleted_at != null) r.deleted_at = new Date(r.deleted_at);
  if (r.created_at != null) r.created_at = new Date(r.created_at);
  if (r.transaction_date != null) r.transaction_date = new Date(r.transaction_date);
  if (r.start_date != null) r.start_date = new Date(r.start_date);
  if (r.end_date != null) r.end_date = new Date(r.end_date);
  return r;
}

/**
 * Run conflict resolution (Last-Write-Wins) against a batch of client records
 * using a lookup Map of existing server records.
 *
 * Strategy:
 *  - If record does NOT exist on server → schedule for CREATE
 *  - If record exists on server AND client.updated_at > server.updated_at → schedule for UPDATE
 *  - If record exists on server AND client.updated_at <= server.updated_at → SKIP (server wins)
 *
 * @param {Array<Object>} clientRecords - Deserialized client records
 * @param {Map<string, Object>} serverMap - Map<id, {id, updated_at}> from server
 * @returns {{ toCreate: Array, toUpdate: Array, skipped: string[] }}
 */
function resolveConflicts(clientRecords, serverMap) {
  const toCreate = [];
  const toUpdate = [];
  const skipped = [];

  for (const record of clientRecords) {
    const serverRecord = serverMap.get(record.id);

    if (!serverRecord) {
      // New record from client — create on server
      toCreate.push(record);
    } else if (record.updated_at > serverRecord.updated_at) {
      // Client has newer version — update server (Last-Write-Wins)
      toUpdate.push(record);
    } else {
      // Server is newer or equal — skip, do not overwrite
      skipped.push(record.id);
    }
  }

  return { toCreate, toUpdate, skipped };
}

// ---------------------------------------------------------------------------
// Service exports
// ---------------------------------------------------------------------------

export const syncService = {
  /**
   * Pull all records changed since `lastSyncTime` for the authenticated user.
   * Returns both active AND soft-deleted records so the client can remove locals.
   *
   * @param {string} userId - Authenticated user's ID (from JWT)
   * @param {Date} lastSyncTime - Fetch records updated strictly after this date
   * @returns {Promise<{
   *   wallets: Array,
   *   categories: Array,
   *   transactions: Array,
   *   budgets: Array,
   *   server_sync_time: string
   * }>}
   */
  async pull(userId, lastSyncTime) {
    logger.info('SyncService.pull for userId:', userId, '| since:', lastSyncTime.toISOString());

    // Run all 4 queries in parallel — independent, no ordering dependency
    const [wallets, categories, transactions, budgets] = await Promise.all([
      syncRepository.getChangedWallets(userId, lastSyncTime),
      syncRepository.getChangedCategories(userId, lastSyncTime),
      syncRepository.getChangedTransactions(userId, lastSyncTime),
      syncRepository.getChangedBudgets(userId, lastSyncTime),
    ]);

    logger.debug('SyncService.pull result counts:', {
      wallets: wallets.length,
      categories: categories.length,
      transactions: transactions.length,
      budgets: budgets.length,
    });

    return {
      wallets: serializeRecords(wallets),
      categories: serializeRecords(categories),
      transactions: serializeRecords(transactions),
      budgets: serializeRecords(budgets),
      server_sync_time: new Date().toISOString(),
    };
  },

  /**
   * Push a batch of changed records from the client to the server.
   * Applies Last-Write-Wins conflict resolution per record:
   *  - New records are created.
   *  - Client records newer than the server version are applied.
   *  - Server records newer than (or equal to) the client version are kept intact.
   *
   * Entire operation runs inside a Prisma transaction for atomicity.
   *
   * @param {string} userId - Authenticated user's ID (from JWT)
   * @param {Object} payload
   * @param {Array<Object>} payload.wallets
   * @param {Array<Object>} payload.categories
   * @param {Array<Object>} payload.transactions
   * @param {Array<Object>} payload.budgets
   * @returns {Promise<{
   *   applied: { wallets: string[], categories: string[], transactions: string[], budgets: string[] },
   *   skipped: { wallets: string[], categories: string[], transactions: string[], budgets: string[] },
   *   server_sync_time: string
   * }>}
   * @throws {Error} ERROR_MESSAGES.SYNC_PUSH_INVALID_PAYLOAD
   */
  async push(userId, payload) {
    logger.info('SyncService.push for userId:', userId, '| payload sizes:', {
      wallets: payload.wallets?.length ?? 0,
      categories: payload.categories?.length ?? 0,
      transactions: payload.transactions?.length ?? 0,
      budgets: payload.budgets?.length ?? 0,
    });

    // Deserialize all client records (convert string BigInts → BigInt, strings → Dates)
    const clientWallets = (payload.wallets ?? []).map((r) => deserializeClientRecord(r, 'wallet'));
    const clientCategories = (payload.categories ?? []).map((r) => deserializeClientRecord(r, 'category'));
    const clientTransactions = (payload.transactions ?? []).map((r) => deserializeClientRecord(r, 'transaction'));
    const clientBudgets = (payload.budgets ?? []).map((r) => deserializeClientRecord(r, 'budget'));

    // --- Step 1: Batch-fetch server state for all incoming IDs in parallel ---
    // One query per model (4 queries total) instead of N queries per record.
    const walletIds = clientWallets.map((r) => r.id);
    const categoryIds = clientCategories.map((r) => r.id);
    const transactionIds = clientTransactions.map((r) => r.id);
    const budgetIds = clientBudgets.map((r) => r.id);

    const [serverWallets, serverCategories, serverTransactions, serverBudgets] = await Promise.all([
      walletIds.length > 0
        ? syncRepository.findManyByIds('wallet', walletIds)
        : Promise.resolve(new Map()),
      categoryIds.length > 0
        ? syncRepository.findManyByIds('category', categoryIds)
        : Promise.resolve(new Map()),
      transactionIds.length > 0
        ? syncRepository.findManyByIds('transaction', transactionIds)
        : Promise.resolve(new Map()),
      budgetIds.length > 0
        ? syncRepository.findManyByIds('budget', budgetIds)
        : Promise.resolve(new Map()),
    ]);

    // --- Step 2: Conflict resolution (Last-Write-Wins) — pure in-memory, no DB calls ---
    const walletResolution = resolveConflicts(clientWallets, serverWallets);
    const categoryResolution = resolveConflicts(clientCategories, serverCategories);
    const transactionResolution = resolveConflicts(clientTransactions, serverTransactions);
    const budgetResolution = resolveConflicts(clientBudgets, serverBudgets);

    logger.debug('SyncService.push conflict resolution:', {
      wallets: { toCreate: walletResolution.toCreate.length, toUpdate: walletResolution.toUpdate.length, skipped: walletResolution.skipped.length },
      categories: { toCreate: categoryResolution.toCreate.length, toUpdate: categoryResolution.toUpdate.length, skipped: categoryResolution.skipped.length },
      transactions: { toCreate: transactionResolution.toCreate.length, toUpdate: transactionResolution.toUpdate.length, skipped: transactionResolution.skipped.length },
      budgets: { toCreate: budgetResolution.toCreate.length, toUpdate: budgetResolution.toUpdate.length, skipped: budgetResolution.skipped.length },
    });

    // --- Step 3: Execute all creates/updates in a single atomic Prisma transaction ---
    const result = await syncRepository.executeTransaction(async (tx) => {
      const [walletsResult, categoriesResult, transactionsResult, budgetsResult] = await Promise.all([
        syncRepository.batchUpsertWallets(tx, walletResolution.toCreate, walletResolution.toUpdate),
        syncRepository.batchUpsertCategories(tx, categoryResolution.toCreate, categoryResolution.toUpdate),
        syncRepository.batchUpsertTransactions(tx, transactionResolution.toCreate, transactionResolution.toUpdate),
        syncRepository.batchUpsertBudgets(tx, budgetResolution.toCreate, budgetResolution.toUpdate),
      ]);

      return {
        applied: {
          wallets: [...walletsResult.created, ...walletsResult.updated],
          categories: [...categoriesResult.created, ...categoriesResult.updated],
          transactions: [...transactionsResult.created, ...transactionsResult.updated],
          budgets: [...budgetsResult.created, ...budgetsResult.updated],
        },
        skipped: {
          wallets: walletResolution.skipped,
          categories: categoryResolution.skipped,
          transactions: transactionResolution.skipped,
          budgets: budgetResolution.skipped,
        },
      };
    });

    logger.info('SyncService.push completed for userId:', userId);

    return {
      ...result,
      server_sync_time: new Date().toISOString(),
    };
  },
};

export default syncService;
