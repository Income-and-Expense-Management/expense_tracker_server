import prisma from '../config/database.js';

const categoryRepository = {
  async create(categoryData) {
    return await prisma.category.create({
      data: categoryData,
    });
  },

  async findById(id) {
    return await prisma.category.findUnique({
      where: { id },
    });
  },

  /**
   * Find all non-deleted, active categories for a user.
   * - deleted_at = null: excludes soft-deleted (permanently removed) categories.
   * @param {string} userId
   * @param {string|null} [type] - Optional type filter ('income' or 'expense')
   * @param {boolean} [includeInactive=false] - Whether to include is_active=false categories
   * @returns {Promise<Array<Object>>}
   */
  async findByUserId(userId, type = null, includeInactive = false) {
    const where = {
      OR: [
        { user_id: userId },
        { user_id: null }
      ],
      deleted_at: null,
    };

    if (!includeInactive) {
      where.is_active = true;
    }

    if (type) {
      where.type = type;
    }

    return await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  },

  async update(id, categoryData) {
    return await prisma.category.update({
      where: { id },
      data: {
        ...categoryData,
        updated_at: new Date(),
      },
    });
  },

  /**
   * Soft-delete a category (for sync logic).
   * Sets deleted_at and is_active=false so the category is fully hidden.
   * Existing transactions linked to this category are preserved for historical reporting.
   * @param {string} id
   */
  async softDelete(id) {
    return await prisma.category.update({
      where: { id },
      data: {
        is_active: false,
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  },
};

export default categoryRepository;
