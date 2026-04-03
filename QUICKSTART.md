# ⚡ QUICK START - Khởi Động Nhanh

Hướng dẫn nhanh để chạy server trong 5 phút!

## 📦 Bước 1: Cài Đặt

```bash
# Đã cài dependencies rồi, bỏ qua bước này
# npm install
```

## ⚙️ Bước 2: Cấu Hình Database

### 2.1. Tạo Database trong SQL Server

```sql
CREATE DATABASE QLCT_DB;
```

### 2.2. Cập nhật file `.env`

Mở file `.env` và thay đổi thông tin kết nối:

```env
DATABASE_URL="sqlserver://localhost:1433;database=QLCT_DB;user=SA;password=YOUR_PASSWORD;encrypt=true;trustServerCertificate=true"
JWT_SECRET="your-secret-key-here-change-me"
```

**Quan trọng:**
- Thay `YOUR_PASSWORD` bằng password SQL Server của bạn
- Thay `JWT_SECRET` bằng một chuỗi bảo mật phức tạp

## 🗄️ Bước 3: Setup Database Schema

```bash
# Push schema lên database
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate
```

## 🧪 Bước 4: Test Kết Nối

```bash
npm run test:db
```

Nếu thấy thông báo **"✅ Kết nối database thành công!"** là OK!

## 🚀 Bước 5: Chạy Server

```bash
npm run dev
```

Server sẽ chạy tại: **http://localhost:3000**

## 🎯 Bước 6: Test API

### Test bằng cURL:

#### Đăng ký user mới:
```bash
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test@gmail.com\",\"password\":\"123456\",\"full_name\":\"Test User\"}"
```

#### Đăng nhập:
```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@gmail.com\",\"password\":\"123456\"}"
```

**Lưu lại token từ response để test các API khác!**

#### Xem profile (thay YOUR_TOKEN):
```bash
curl -X GET http://localhost:3000/api/auth/profile -H "Authorization: Bearer YOUR_TOKEN"
```

### Hoặc test bằng Postman:

1. Import collection từ file `GUIDE.md`
2. Test từng endpoint

## ✅ Xong!

Server đã sẵn sàng! 🎉

## 📋 Tóm Tắt Commands

```bash
# Test database connection
npm run test:db

# Chạy server (development)
npm run dev

# Chạy server (production)
npm start

# Push database schema
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate

# Open Prisma Studio (Database GUI)
npm run prisma:studio
```

## 🔗 API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | ❌ | Đăng ký |
| POST | `/api/auth/login` | ❌ | Đăng nhập |
| POST | `/api/auth/logout` | ✅ | Đăng xuất |
| GET | `/api/auth/profile` | ✅ | Xem profile |
| PUT | `/api/auth/profile` | ✅ | Cập nhật profile |
| PUT | `/api/auth/change-password` | ✅ | Đổi mật khẩu |

## 🐛 Gặp Lỗi?

### Lỗi kết nối database:
1. Kiểm tra SQL Server đang chạy
2. Kiểm tra DATABASE_URL trong `.env`
3. Chạy: `npm run test:db`

### Lỗi Prisma Client:
```bash
npm run prisma:generate
```

### Lỗi Tables không tồn tại:
```bash
npm run prisma:push
```

## 📚 Đọc Thêm

- **README.md** - API Documentation đầy đủ
- **GUIDE.md** - Hướng dẫn chi tiết tích hợp Android
- **SUMMARY.md** - Tổng quan kiến trúc hệ thống

---

Happy Coding! 🚀
