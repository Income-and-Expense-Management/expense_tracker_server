import prisma from '../config/database.js';

/**
 * Repository for infrastructure-level health checks.
 * Isolates Prisma access for the health endpoint, keeping routes/index.js clean.
 */
const healthRepository = {
  /**
   * Verify the database connection is alive.
   * @returns {Promise<boolean>} true if connected, false otherwise.
   */
  async checkConnection() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  },
};

export default healthRepository;
