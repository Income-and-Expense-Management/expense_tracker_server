require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({});

// Test connection
prisma.$connect()
  .then(() => console.log('✅ Đã kết nối database thành công'))
  .catch((err) => console.error('❌ Lỗi kết nối database:', err));

module.exports = prisma;
