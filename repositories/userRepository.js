const prisma = require('../config/database');

class UserRepository {
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        full_name: true,
        email: true,
        avatar_url: true,
        auth_provider: true,
        created_at: true,
      },
    });
  }

  async create(userData) {
    return await prisma.user.create({
      data: userData,
      select: {
        id: true,
        full_name: true,
        email: true,
        avatar_url: true,
        auth_provider: true,
        created_at: true,
      },
    });
  }

  async update(id, userData) {
    return await prisma.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        full_name: true,
        email: true,
        avatar_url: true,
        auth_provider: true,
        created_at: true,
      },
    });
  }

  async delete(id) {
    return await prisma.user.delete({
      where: { id },
    });
  }
}

module.exports = new UserRepository();
