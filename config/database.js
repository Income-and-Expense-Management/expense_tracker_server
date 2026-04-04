import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({});

// Test connection
prisma.$connect()
  .then(() => console.log('✅ Đã kết nối database thành công'))
  .catch((err) => console.error('❌ Lỗi kết nối database:', err));

export default prisma;
