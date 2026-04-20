import categoryRepository from '../repositories/categoryRepository.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';
import { logger } from '../utils/logger.js';

export const categoryService = {
  /**
   * Create a new category for a user.
   * @param {string} userId - Owner user ID
   * @param {Object} categoryData
   * @param {string} categoryData.name - Category name
   * @param {string} categoryData.type - 'INCOME' or 'EXPENSE'
   * @param {string} [categoryData.icon_name] - Icon name
   * @returns {Promise<Object>} Created category
   * @throws {Error} ERROR_MESSAGES.INVALID_CATEGORY_TYPE
   */
  async createCategory(userId, categoryData) {
    logger.info('CategoryService.createCategory for userId:', userId);
    const { name, type, icon_name } = categoryData;

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      throw new Error(ERROR_MESSAGES.INVALID_CATEGORY_TYPE);
    }

    const newCategory = await categoryRepository.create({
      user_id: userId,
      name,
      type,
      icon_name,
    });

    return newCategory;
  },

  /**
   * Get a category by ID with ownership check.
   * @param {string} categoryId - Category ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<Object>} Category object
   * @throws {Error} ERROR_MESSAGES.CATEGORY_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.CATEGORY_ACCESS_DENIED
   */
  async getCategoryById(categoryId, userId) {
    logger.info('CategoryService.getCategoryById:', categoryId);
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new Error(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    if (category.user_id !== userId && category.user_id !== null) {
      throw new Error(ERROR_MESSAGES.CATEGORY_ACCESS_DENIED);
    }

    return category;
  },

  /**
   * Get all categories for a user, optionally filtered by type.
   * @param {string} userId - Owner user ID
   * @param {string|null} [type=null] - Optional type filter ('income' or 'expense')
   * @param {boolean} [includeInactive=false] - Whether to include is_active=false categories
   * @returns {Promise<Array<Object>>} Array of categories
   */
  async getAllCategories(userId, type = null, includeInactive = false) {
    logger.info('CategoryService.getAllCategories for userId:', userId);
    const categories = await categoryRepository.findByUserId(userId, type, includeInactive);
    return categories;
  },

  /**
   * Update a category with ownership check.
   * @param {string} categoryId - Category ID
   * @param {string} userId - Requesting user ID
   * @param {Object} categoryData - Fields to update
   * @param {string} [categoryData.name]
   * @param {string} [categoryData.type] - 'income' or 'expense'
   * @param {string} [categoryData.icon_name]
   * @returns {Promise<Object>} Updated category
   * @throws {Error} ERROR_MESSAGES.CATEGORY_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.CATEGORY_UPDATE_DENIED
   * @throws {Error} ERROR_MESSAGES.INVALID_CATEGORY_TYPE
   */
  async updateCategory(categoryId, userId, categoryData) {
    logger.info('CategoryService.updateCategory:', categoryId);
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new Error(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    if (category.user_id !== userId && category.user_id !== null) {
      throw new Error(ERROR_MESSAGES.CATEGORY_UPDATE_DENIED);
    }

    const updateData = {};
    
    // NÆ°u lÃ  category cá»§a há»‡ thá»‘ng, chá»‰ cho phÃ©p báºt táº¯t
    if (category.user_id === null) {
      if (categoryData.is_active !== undefined) {
        updateData.is_active = categoryData.is_active;
      } else {
        throw new Error(ERROR_MESSAGES.CATEGORY_UPDATE_DENIED);
      }
    } else {
      if (categoryData.name !== undefined) updateData.name = categoryData.name;
      if (categoryData.type !== undefined) {
        if (!['INCOME', 'EXPENSE'].includes(categoryData.type)) {
          throw new Error(ERROR_MESSAGES.INVALID_CATEGORY_TYPE);
        }
        updateData.type = categoryData.type;
      }
      if (categoryData.icon_name !== undefined) {
        updateData.icon_name = categoryData.icon_name;
      }
      if (categoryData.is_active !== undefined) {
        updateData.is_active = categoryData.is_active;
      }
    }

    const updatedCategory = await categoryRepository.update(categoryId, updateData);
    return updatedCategory;
  },

  /**
   * Soft-delete a category with ownership check.
   * Sets is_active=false and deleted_at for sync support.
   * Existing transactions linked to this category are preserved for historical reporting.
   * @param {string} categoryId - Category ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<{message: string}>}
   * @throws {Error} ERROR_MESSAGES.CATEGORY_NOT_FOUND
   * @throws {Error} ERROR_MESSAGES.CATEGORY_DELETE_DENIED
   */
  async deleteCategory(categoryId, userId) {
    logger.info('CategoryService.deleteCategory:', categoryId);
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new Error(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    if (category.user_id !== userId) {
      throw new Error(ERROR_MESSAGES.CATEGORY_DELETE_DENIED);
    }

    await categoryRepository.softDelete(categoryId);

    return { message: 'Xóa danh mục thành công' };
  },
};

export default categoryService;
