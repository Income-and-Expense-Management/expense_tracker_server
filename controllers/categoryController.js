const categoryService = require('../services/categoryService');
const responseUtils = require('../utils/responseUtils');

class CategoryController {
  async createCategory(req, res) {
    try {
      const userId = req.user.userId;
      const { name, type, icon_name } = req.body;

      if (!name || !type) {
        return responseUtils.badRequest(res, 'Tên và loại danh mục là bắt buộc');
      }

      const category = await categoryService.createCategory(userId, {
        name,
        type,
        icon_name,
      });

      return responseUtils.created(res, category, 'Tạo danh mục thành công');
    } catch (error) {
      if (error.message.includes('không hợp lệ')) {
        return responseUtils.badRequest(res, error.message);
      }
      console.error('Create category error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async getCategoryById(req, res) {
    try {
      const userId = req.user.userId;
      const { categoryId } = req.params;

      const category = await categoryService.getCategoryById(categoryId, userId);

      return responseUtils.success(res, category, 'Lấy thông tin danh mục thành công');
    } catch (error) {
      if (error.message === 'Không tìm thấy danh mục') {
        return responseUtils.notFound(res, error.message);
      }
      if (error.message.includes('không có quyền')) {
        return responseUtils.forbidden(res, error.message);
      }
      console.error('Get category error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async getAllCategories(req, res) {
    try {
      const userId = req.user.userId;
      const { type } = req.query;

      const categories = await categoryService.getAllCategories(userId, type);

      return responseUtils.success(res, categories, 'Lấy danh sách danh mục thành công');
    } catch (error) {
      console.error('Get all categories error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async updateCategory(req, res) {
    try {
      const userId = req.user.userId;
      const { categoryId } = req.params;
      const { name, type, icon_name } = req.body;

      const category = await categoryService.updateCategory(categoryId, userId, {
        name,
        type,
        icon_name,
      });

      return responseUtils.success(res, category, 'Cập nhật danh mục thành công');
    } catch (error) {
      if (error.message === 'Không tìm thấy danh mục') {
        return responseUtils.notFound(res, error.message);
      }
      if (error.message.includes('không có quyền')) {
        return responseUtils.forbidden(res, error.message);
      }
      if (error.message.includes('không hợp lệ')) {
        return responseUtils.badRequest(res, error.message);
      }
      console.error('Update category error:', error);
      return responseUtils.error(res, error.message);
    }
  }

  async deleteCategory(req, res) {
    try {
      const userId = req.user.userId;
      const { categoryId } = req.params;

      const result = await categoryService.deleteCategory(categoryId, userId);

      return responseUtils.success(res, result, 'Xóa danh mục thành công');
    } catch (error) {
      if (error.message === 'Không tìm thấy danh mục') {
        return responseUtils.notFound(res, error.message);
      }
      if (error.message.includes('không có quyền')) {
        return responseUtils.forbidden(res, error.message);
      }
      console.error('Delete category error:', error);
      return responseUtils.error(res, error.message);
    }
  }
}

module.exports = new CategoryController();
