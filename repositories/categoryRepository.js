import prisma from '../config/database.js';

const CategoryRepository = {
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

  async findByUserId(userId, type = null) {
    const where = { user_id: userId };
    
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
      data: categoryData,
    });
  },

  async delete(id) {
    return await prisma.category.delete({
      where: { id },
    });
  },
}

export default CategoryRepository;
