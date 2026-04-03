// Kiểm tra kết nối database và Prisma Client
require('dotenv').config();
const prisma = require('./config/database');

async function testConnection() {
  try {
    console.log('🔍 Đang kiểm tra kết nối database...');
    
    // Test kết nối
    await prisma.$connect();
    console.log('✅ Kết nối database thành công!');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log(`📊 Số lượng users trong database: ${userCount}`);
    
    console.log('\n✨ Hệ thống sẵn sàng! Bạn có thể chạy server bằng: npm run dev');
    
  } catch (error) {
    console.error('❌ Lỗi kết nối database:', error.message);
    console.log('\n💡 Vui lòng kiểm tra:');
    console.log('   1. SQL Server đang chạy');
    console.log('   2. Thông tin DATABASE_URL trong file .env đúng');
    console.log('   3. Database đã được tạo: CREATE DATABASE QLCT_DB;');
    console.log('   4. Đã chạy: npx prisma db push');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
