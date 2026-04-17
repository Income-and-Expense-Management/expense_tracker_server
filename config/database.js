import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient({});

// Test connection
prisma.$connect()
  .then(() => logger.info('✅ Đã kết nối database thành công'))
  .catch((err) => logger.error('❌ Lỗi kết nối database:', err));

export default prisma;
