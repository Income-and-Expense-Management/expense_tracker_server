import { budgetService } from '../services/budgetService.js';
import ApiResponse from '../utils/responseUtils.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

const budgetController = {
  async createBudget(req, res) {
    try {
      const userId = req.user.userId;
      const { wallet_id, category_id, target_amount, start_date, end_date } = req.body;

      if (!wallet_id || !category_id || !target_amount) {
        return ApiResponse.badRequest(res, 'Ví, danh mục và số tiền mục tiêu là bắt buộc');
      }

      if (target_amount <= 0) {
        return ApiResponse.badRequest(res, 'Số tiền mục tiêu phải lớn hơn 0');
      }

      const budget = await budgetService.createBudget(userId, {
        wallet_id,
        category_id,
        target_amount,
        start_date,
        end_date,
      });

      return ApiResponse.created(res, budget, 'Tạo ngân sách thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.WALLET_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.BUDGET_ACCESS_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Create budget error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  async getAllBudgets(req, res) {
    try {
      const userId = req.user.userId;
      const { wallet_id, category_id } = req.query;

      const filters = {};
      if (wallet_id) filters.wallet_id = wallet_id;
      if (category_id) filters.category_id = category_id;

      const budgets = await budgetService.getAllBudgets(userId, filters);

      return ApiResponse.success(res, budgets, 'Lấy danh sách ngân sách thành công');
    } catch (error) {
      logger.error('Get all budgets error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  async getBudgetById(req, res) {
    try {
      const userId = req.user.userId;
      const { budgetId } = req.params;

      const budget = await budgetService.getBudgetById(budgetId, userId);

      return ApiResponse.success(res, budget, 'Lấy thông tin ngân sách thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.BUDGET_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.BUDGET_ACCESS_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Get budget error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  async updateBudget(req, res) {
    try {
      const userId = req.user.userId;
      const { budgetId } = req.params;
      const { category_id, target_amount, start_date, end_date } = req.body;

      if (target_amount !== undefined && target_amount <= 0) {
        return ApiResponse.badRequest(res, 'Số tiền mục tiêu phải lớn hơn 0');
      }

      const budget = await budgetService.updateBudget(budgetId, userId, {
        category_id,
        target_amount,
        start_date,
        end_date,
      });

      return ApiResponse.success(res, budget, 'Cập nhật ngân sách thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.BUDGET_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.BUDGET_UPDATE_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Update budget error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  async deleteBudget(req, res) {
    try {
      const userId = req.user.userId;
      const { budgetId } = req.params;

      const result = await budgetService.deleteBudget(budgetId, userId);

      return ApiResponse.success(res, result, 'Xóa ngân sách thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.BUDGET_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.BUDGET_DELETE_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Delete budget error:', error);
      return ApiResponse.error(res, error.message);
    }
  },
};

export default budgetController;
