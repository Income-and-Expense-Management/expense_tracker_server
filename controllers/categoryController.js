import { categoryService } from '../services/categoryService.js';
import ApiResponse from '../utils/responseUtils.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

/**
 * Category controller — thin HTTP adapter.
 * All field validation is handled by categoryValidators.js middleware upstream.
 */
const categoryController = {
  /**
   * POST /categories
   */
  async createCategory(req, res) {
    try {
      const userId = req.user.userId;
      const { id, name, type, icon_name } = req.body;

      const category = await categoryService.createCategory(userId, { id, name, type, icon_name });

      return ApiResponse.created(res, category, 'Tạo danh mục thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.INVALID_CATEGORY_TYPE) {
        return ApiResponse.badRequest(res, error.message);
      }
      logger.error('Create category error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * GET /categories/:categoryId
   */
  async getCategoryById(req, res) {
    try {
      const userId = req.user.userId;
      const { categoryId } = req.params;

      const category = await categoryService.getCategoryById(categoryId, userId);

      return ApiResponse.success(res, category, 'Lấy thông tin danh mục thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.CATEGORY_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.CATEGORY_ACCESS_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Get category error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * GET /categories
   */
  async getAllCategories(req, res) {
    try {
      const userId = req.user.userId;
      const { type, include_inactive } = req.query;
      
      const includeInactive = include_inactive === 'true';

      const categories = await categoryService.getAllCategories(userId, type, includeInactive);

      return ApiResponse.success(res, categories, 'Lấy danh sách danh mục thành công');
    } catch (error) {
      logger.error('Get all categories error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * PATCH /categories/:categoryId
   */
  async updateCategory(req, res) {
    try {
      const userId = req.user.userId;
      const { categoryId } = req.params;
      const { name, type, icon_name, is_active } = req.body;

      const category = await categoryService.updateCategory(categoryId, userId, {
        name,
        type,
        icon_name,
        is_active
      });

      return ApiResponse.success(res, category, 'Cập nhật danh mục thành công');
    } catch (error) {
      if (error.message === ERROR_MESSAGES.CATEGORY_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.CATEGORY_UPDATE_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.INVALID_CATEGORY_TYPE) {
        return ApiResponse.badRequest(res, error.message);
      }
      logger.error('Update category error:', error);
      return ApiResponse.error(res, error.message);
    }
  },

  /**
   * DELETE /categories/:categoryId
   * Returns 204 No Content on success (REST §3).
   */
  async deleteCategory(req, res) {
    try {
      const userId = req.user.userId;
      const { categoryId } = req.params;

      await categoryService.deleteCategory(categoryId, userId);

      return ApiResponse.noContent(res);
    } catch (error) {
      if (error.message === ERROR_MESSAGES.CATEGORY_NOT_FOUND) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message === ERROR_MESSAGES.CATEGORY_DELETE_DENIED) {
        return ApiResponse.forbidden(res, error.message);
      }
      logger.error('Delete category error:', error);
      return ApiResponse.error(res, error.message);
    }
  },
};

export default categoryController;
