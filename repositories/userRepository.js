import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';

const userRepository = {
  async findByEmail(email) {
    logger.debug('UserRepository.findByEmail:', email);
    const result = await prisma.user.findUnique({
      where: { email },
    });
    logger.debug('UserRepository.findByEmail result:', result ? result.id : null);
    return result;
  },

  async findById(id) {
    logger.debug('UserRepository.findById:', id);
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
    logger.debug('UserRepository.findById result:', result ? result.id : null);
    return result;
  },

  /**
   * Fetch a user by ID **including** the hashed password field.
   * Only for internal auth operations (changePassword). Never expose to clients.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findByIdWithPassword(id) {
    logger.debug('UserRepository.findByIdWithPassword:', id);
    const result = await prisma.user.findUnique({
      where: { id },
    });
    logger.debug('UserRepository.findByIdWithPassword result:', result ? result.id : null);
    return result;
  },

  async create(userData) {
    logger.info('UserRepository.create for:', userData.email);
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
    logger.info('UserRepository.create result id:', result.id);
    return result;
  },

  async update(id, userData) {
    logger.debug('UserRepository.update id:', id);
    const result = await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        updated_at: new Date(),
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        avatar_url: true,
        auth_provider: true,
        created_at: true,
        updated_at: true,
      },
    });
    logger.debug('UserRepository.update result id:', result.id);
    return result;
  },

  async delete(id) {
    logger.info('UserRepository.delete id:', id);
    const result = await prisma.user.delete({
      where: { id },
    });
    logger.info('UserRepository.delete result id:', result ? result.id : null);
    return result;
  },
};

export default userRepository;
