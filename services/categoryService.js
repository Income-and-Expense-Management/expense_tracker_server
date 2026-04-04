const categoryRepository = require('../repositories/categoryRepository');

class CategoryService {
  async createCategory(userId, categoryData) {
    const { name, type, icon_name } = categoryData;

    if (!['income', 'expense'].includes(type)) {
      throw new Error('Loại danh mục không hợp lệ');
    }

    const newCategory = await categoryRepository.create({
      user_id: userId,
      name,
      type,
      icon_name,
    });

    return newCategory;
  }

  async getCategoryById(categoryId, userId) {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    if (category.user_id !== userId) {
      throw new Error('Bạn không có quyền truy cập danh mục này');
    }

    return category;
  }

  async getAllCategories(userId, type = null) {
    const categories = await categoryRepository.findByUserId(userId, type);
    return categories;
  }

  async updateCategory(categoryId, userId, categoryData) {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    if (category.user_id !== userId) {
      throw new Error('Bạn không có quyền cập nhật danh mục này');
    }

    const updateData = {};
    if (categoryData.name) updateData.name = categoryData.name;
    if (categoryData.type) {
      if (!['income', 'expense'].includes(categoryData.type)) {
        throw new Error('Loại danh mục không hợp lệ');
      }
      updateData.type = categoryData.type;
    }
    if (categoryData.icon_name !== undefined) {
      updateData.icon_name = categoryData.icon_name;
    }

    const updatedCategory = await categoryRepository.update(categoryId, updateData);
    return updatedCategory;
  }

  async deleteCategory(categoryId, userId) {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    if (category.user_id !== userId) {
      throw new Error('Bạn không có quyền xóa danh mục này');
    }

    await categoryRepository.delete(categoryId);

    return { message: 'Xóa danh mục thành công' };
  }
}

module.exports = new CategoryService();
