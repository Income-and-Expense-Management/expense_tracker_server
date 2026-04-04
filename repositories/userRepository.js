import prisma from '../config/database.js';

class UserRepository {
  async findByEmail(email) {
    console.log('UserRepository.findByEmail:', email);
    const result = await prisma.user.findUnique({
      where: { email },
    });
    console.log('UserRepository.findByEmail result:', result ? result.id : null);
    return result;
  }

  async findById(id) {
    console.log('UserRepository.findById:', id);
    const result = await prisma.user.findUnique({
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
    console.log('UserRepository.findById result:', result ? result.id : null);
    return result;
  }

  async create(userData) {
    console.log('UserRepository.create for:', userData.email);
    const result = await prisma.user.create({
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
    console.log('UserRepository.create result id:', result.id);
    return result;
  }

  async update(id, userData) {
    console.log('UserRepository.update id:', id, 'payload:', userData);
    const result = await prisma.user.update({
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
    console.log('UserRepository.update result id:', result.id);
    return result;
  }

  async delete(id) {
    console.log('UserRepository.delete id:', id);
    const result = await prisma.user.delete({
      where: { id },
    });
    console.log('UserRepository.delete result id:', result ? result.id : null);
    return result;
  }
}

export default new UserRepository();
