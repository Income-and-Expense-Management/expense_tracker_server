import budgetRepository from '../repositories/budgetRepository.js';
import walletRepository from '../repositories/walletRepository.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

export const budgetService = {
  /**
   * Create a new budget for a wallet+category combination.
   * @param {string} userId - Requesting user ID
   * @param {Object} budgetData
   * @param {string} budgetData.wallet_id - Target wallet ID
   * @param {string} budgetData.category_id - Target category ID
   * @param {number|string} budgetData.target_amount - Budget target amount
   * @param {string} [budgetData.start_date] - ISO date string
   * @param {string} [budgetData.end_date] - ISO date string
   * @returns {Promise<Object>} Created budget with target_amount as string
   * @throws {Error} ERROR_MESSAGES.WALLET_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.BUDGET_ACCESS_DENIED
   */
  async createBudget(userId, budgetData) {
    logger.info('BudgetService.createBudget for userId:', userId);
    const { id, wallet_id, category_id, target_amount, start_date, end_date } = budgetData;

    // Verify wallet exists and belongs to user
    const wallet = await walletRepository.findById(wallet_id);
    if (!wallet) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_FOUND);
    }

    if (wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.BUDGET_ACCESS_DENIED);
    }

    const dataPayload = {
      wallet_id,
      category_id,
      target_amount: BigInt(target_amount),
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
    };
    if (id) dataPayload.id = id;

    const newBudget = await budgetRepository.create(dataPayload);

    return {
      ...newBudget,
      target_amount: newBudget.target_amount.toString(),
    };
  },

  /**
   * Get all budgets for a user with optional filters.
   * @param {string} userId - Owner user ID
   * @param {Object} [filters={}]
   * @param {string} [filters.wallet_id]
   * @param {string} [filters.category_id]
   * @returns {Promise<Array<Object>>} Budgets with target_amount as string
   */
  async getAllBudgets(userId, filters = {}) {
    logger.info('BudgetService.getAllBudgets for userId:', userId);
    const budgets = await budgetRepository.findByUserId(userId, filters);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const totalSpent = await budgetRepository.getTotalSpent(
          budget.wallet_id,
          budget.category_id,
          budget.start_date,
          budget.end_date
        );

        const targetAmount = BigInt(budget.target_amount);
        const remaining = targetAmount - totalSpent;

        return {
          ...budget,
          target_amount: targetAmount.toString(),
          total_spent: totalSpent.toString(),
          remaining: remaining.toString(),
        };
      })
    );

    return budgetsWithSpent;
  },

  /**
   * Get a budget by ID with ownership check and computed spent amount.
   * @param {string} budgetId - Budget ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<Object>} Budget with target_amount, total_spent, remaining as strings
   * @throws {Error} ERROR_MESSAGES.BUDGET_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.BUDGET_ACCESS_DENIED
   */
  async getBudgetById(budgetId, userId) {
    logger.info('BudgetService.getBudgetById:', budgetId);
    const budget = await budgetRepository.findById(budgetId);

    if (!budget) {
      throw new Error(ERROR_MESSAGES.BUDGET_NOT_FOUND);
    }

    // Verify ownership via wallet
    const wallet = await walletRepository.findById(budget.wallet_id);
    if (!wallet || wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.BUDGET_ACCESS_DENIED);
    }

    // Compute total spent for this budget's wallet + category + date range
    const totalSpent = await budgetRepository.getTotalSpent(
      budget.wallet_id,
      budget.category_id,
      budget.start_date,
      budget.end_date
    );

    const targetAmount = BigInt(budget.target_amount);
    const remaining = targetAmount - totalSpent;

    return {
      ...budget,
      target_amount: targetAmount.toString(),
      total_spent: totalSpent.toString(),
      remaining: remaining.toString(),
    };
  },

  /**
   * Update a budget with ownership check.
   * @param {string} budgetId - Budget ID
   * @param {string} userId - Requesting user ID
   * @param {Object} budgetData - Fields to update
   * @param {string} [budgetData.category_id]
   * @param {number|string} [budgetData.target_amount]
   * @param {string} [budgetData.start_date]
   * @param {string} [budgetData.end_date]
   * @returns {Promise<Object>} Updated budget with target_amount as string
   * @throws {Error} ERROR_MESSAGES.BUDGET_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.BUDGET_UPDATE_DENIED
   */
  async updateBudget(budgetId, userId, budgetData) {
    logger.info('BudgetService.updateBudget:', budgetId);
    const budget = await budgetRepository.findById(budgetId);

    if (!budget) {
      throw new Error(ERROR_MESSAGES.BUDGET_NOT_FOUND);
    }

    // Verify ownership via wallet
    const wallet = await walletRepository.findById(budget.wallet_id);
    if (!wallet || wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.BUDGET_UPDATE_DENIED);
    }

    const updateData = {};
    if (budgetData.category_id !== undefined) {
      updateData.category_id = budgetData.category_id;
    }
    if (budgetData.target_amount !== undefined) {
      updateData.target_amount = BigInt(budgetData.target_amount);
    }
    if (budgetData.start_date !== undefined) {
      updateData.start_date = budgetData.start_date ? new Date(budgetData.start_date) : null;
    }
    if (budgetData.end_date !== undefined) {
      updateData.end_date = budgetData.end_date ? new Date(budgetData.end_date) : null;
    }

    const updatedBudget = await budgetRepository.update(budgetId, updateData);

    return {
      ...updatedBudget,
      target_amount: updatedBudget.target_amount.toString(),
    };
  },

  /**
   * Delete a budget with ownership check.
   * @param {string} budgetId - Budget ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<{message: string}>}
   * @throws {Error} ERROR_MESSAGES.BUDGET_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.BUDGET_DELETE_DENIED
   */
  async deleteBudget(budgetId, userId) {
    logger.info('BudgetService.deleteBudget:', budgetId);
    const budget = await budgetRepository.findById(budgetId);

    if (!budget) {
      throw new Error(ERROR_MESSAGES.BUDGET_NOT_FOUND);
    }

    // Verify ownership via wallet
    const wallet = await walletRepository.findById(budget.wallet_id);
    if (!wallet || wallet.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.BUDGET_DELETE_DENIED);
    }

    await budgetRepository.delete(budgetId);

    return { message: 'Xóa ngân sách thành công' };
  },
};

export default budgetService;
