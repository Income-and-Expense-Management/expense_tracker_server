# ✅ HỆ THỐNG AUTHENTICATION ĐÃ HOÀN THÀNH

## 📦 Tổng Quan Dự Án

Hệ thống authentication hoàn chỉnh cho ứng dụng quản lý chi tiêu với:
- ✅ Đăng ký tài khoản (Register)
- ✅ Đăng nhập (Login) 
- ✅ Đăng xuất (Logout)
- ✅ Xem profile
- ✅ Cập nhật profile
- ✅ Đổi mật khẩu

## 🏗 Kiến Trúc Phân Lớp

```
┌─────────────────────────────────────────────────┐
│              CLIENT (Android App)                │
└─────────────┬───────────────────────────────────┘
              │
              ↓ HTTP Request
┌─────────────────────────────────────────────────┐
│           ROUTES (authRoutes.js)                │ ← Define endpoints
└─────────────┬───────────────────────────────────┘
              │
              ↓ Request validation & auth check
┌─────────────────────────────────────────────────┐
│        MIDDLEWARE (authMiddleware.js)           │ ← JWT verification
└─────────────┬───────────────────────────────────┘
              │
              ↓ Handle request
┌─────────────────────────────────────────────────┐
│       CONTROLLERS (authController.js)           │ ← Request/Response handling
└─────────────┬───────────────────────────────────┘
              │
              ↓ Business logic
┌─────────────────────────────────────────────────┐
│         SERVICES (authService.js)               │ ← Business logic
└─────────────┬───────────────────────────────────┘
              │
              ↓ Database operations
┌─────────────────────────────────────────────────┐
│      REPOSITORIES (userRepository.js)           │ ← Data access layer
└─────────────┬───────────────────────────────────┘
              │
              ↓ Prisma ORM
┌─────────────────────────────────────────────────┐
│         DATABASE (SQL Server)                    │
└─────────────────────────────────────────────────┘
```

## 📁 Cấu Trúc File Đã Tạo

```
QLCT_Server/
│
├── 📄 server.js                    # Entry point, khởi động server
├── 📄 .env                         # Environment variables (DATABASE_URL, JWT_SECRET)
├── 📄 .gitignore                   # Git ignore rules
├── 📄 package.json                 # Dependencies & scripts
├── 📄 test-connection.js           # Test database connection
├── 📄 README.md                    # API Documentation đầy đủ
├── 📄 GUIDE.md                     # Hướng dẫn chi tiết sử dụng
│
├── 📁 config/
│   └── database.js                 # Prisma Client configuration
│
├── 📁 prisma/
│   ├── schema.prisma               # Database schema (Users, Wallets, Categories, etc.)
│   └── prisma.config.ts            # Prisma configuration
│
├── 📁 repositories/
│   └── userRepository.js           # User data access layer
│       ├── findByEmail()
│       ├── findById()
│       ├── create()
│       ├── update()
│       └── delete()
│
├── 📁 services/
│   └── authService.js              # Authentication business logic
│       ├── register()
│       ├── login()
│       ├── getProfile()
│       ├── updateProfile()
│       └── changePassword()
│
├── 📁 controllers/
│   └── authController.js           # Handle HTTP requests/responses
│       ├── register()
│       ├── login()
│       ├── logout()
│       ├── getProfile()
│       ├── updateProfile()
│       └── changePassword()
│
├── 📁 middleware/
│   ├── authMiddleware.js           # JWT authentication middleware
│   └── validateRequest.js          # Request validation middleware
│
├── 📁 routes/
│   └── authRoutes.js               # Authentication routes definition
│       ├── POST /auth/register
│       ├── POST /auth/login
│       ├── POST /auth/logout       (protected)
│       ├── GET /auth/profile       (protected)
│       ├── PUT /auth/profile       (protected)
│       └── PUT /auth/change-password (protected)
│
└── 📁 utils/
    ├── jwtUtils.js                 # JWT token utilities
    │   ├── generateToken()
    │   ├── verifyToken()
    │   └── decodeToken()
    │
    ├── passwordUtils.js            # Password hashing utilities
    │   ├── hashPassword()
    │   └── comparePassword()
    │
    └── responseUtils.js            # Standardized response utilities
        ├── success()
        ├── error()
        ├── created()
        ├── badRequest()
        ├── unauthorized()
        ├── forbidden()
        ├── notFound()
        └── conflict()
```

## 🔧 Công Nghệ Sử Dụng

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| **Node.js** | Latest | JavaScript runtime |
| **Express.js** | ^5.2.1 | Web framework |
| **Prisma** | ^7.6.0 | ORM for SQL Server |
| **bcryptjs** | ^3.0.3 | Password hashing |
| **jsonwebtoken** | ^9.0.3 | JWT authentication |
| **dotenv** | ^17.3.1 | Environment variables |
| **cors** | ^2.8.6 | Cross-Origin Resource Sharing |
| **nodemon** | ^3.1.14 | Auto-restart server (dev) |

## 📋 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    full_name NVARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    avatar_url NVARCHAR(MAX),
    auth_provider VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE()
);
```

## 🚀 Các Lệnh NPM Scripts

```bash
# Chạy server (production)
npm start

# Chạy server với nodemon (development)
npm run dev

# Test kết nối database
npm run test:db

# Generate Prisma Client
npm run prisma:generate

# Push schema lên database
npm run prisma:push

# Mở Prisma Studio (GUI quản lý database)
npm run prisma:studio
```

## 🔐 Bảo Mật

### Password Security
- ✅ Passwords được hash bằng **bcrypt** với salt rounds = 10
- ✅ Password tối thiểu 6 ký tự
- ✅ Password không bao giờ được trả về trong response

### JWT Token
- ✅ Token được sign bằng JWT_SECRET
- ✅ Token có thời gian hết hạn (default: 7 ngày)
- ✅ Token được gửi trong Authorization header: `Bearer <token>`
- ✅ Protected routes yêu cầu valid token

### Database Security
- ✅ Prisma ORM ngăn chặn SQL Injection
- ✅ Email unique constraint
- ✅ Cascading delete relationships

## 📡 API Endpoints

### Public Routes (No authentication required)

#### 1. Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nguyen Van A"
}
```

#### 2. Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Protected Routes (Require JWT token)

#### 3. Get Profile
```
GET /api/auth/profile
Authorization: Bearer <token>
```

#### 4. Update Profile
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "Updated Name",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### 5. Change Password
```
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```

#### 6. Logout
```
POST /api/auth/logout
Authorization: Bearer <token>
```

## 🎯 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Message here",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ] // Optional
}
```

## 🔄 Luồng Hoạt Động

### Đăng Ký (Register)
1. Client gửi email + password + full_name
2. Controller validate input (email format, password length)
3. Service kiểm tra email đã tồn tại chưa
4. Hash password bằng bcrypt
5. Repository lưu user vào database
6. Generate JWT token
7. Trả về user info + token

### Đăng Nhập (Login)
1. Client gửi email + password
2. Controller validate input
3. Service tìm user theo email
4. Compare password với hash trong database
5. Generate JWT token
6. Trả về user info + token

### Protected Request
1. Client gửi request với token trong header
2. authMiddleware verify token
3. Nếu valid: gắn user info vào req.user, tiếp tục
4. Nếu invalid: return 401 Unauthorized
5. Controller xử lý request với req.user.userId

## 📱 Tích Hợp Android

### Sử dụng Retrofit:
1. Tạo data models (User, AuthResponse, etc.)
2. Define API service interface
3. Create Retrofit instance với base URL
4. Implement Repository pattern
5. Sử dụng trong ViewModel
6. Save token vào SharedPreferences/DataStore
7. Thêm token vào header cho protected requests

**Chi tiết xem file GUIDE.md**

## 📊 HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Success responses |
| 201 | Created | Register success |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Email already exists |
| 500 | Server Error | Internal error |

## ✅ Checklist Triển Khai

### Setup Server
- [x] Install dependencies
- [x] Configure Prisma with SQL Server
- [x] Create database schema
- [x] Setup environment variables
- [x] Generate Prisma Client

### Authentication System
- [x] User repository
- [x] Auth service
- [x] Auth controller
- [x] Auth routes
- [x] JWT middleware
- [x] Password utilities
- [x] JWT utilities
- [x] Response utilities

### Documentation
- [x] README.md với API docs
- [x] GUIDE.md với hướng dẫn chi tiết
- [x] SUMMARY.md tổng quan hệ thống
- [x] Code comments

### Testing
- [x] Database connection test script
- [x] Test registration endpoint
- [x] Test login endpoint
- [x] Test protected routes

## 🎓 Cách Sử Dụng

### Bước 1: Setup Database
```bash
# 1. Tạo database trong SQL Server
CREATE DATABASE QLCT_DB;

# 2. Update .env với connection string

# 3. Push schema
npm run prisma:push

# 4. Generate Prisma Client
npm run prisma:generate
```

### Bước 2: Test Kết Nối
```bash
npm run test:db
```

### Bước 3: Chạy Server
```bash
npm run dev
```

### Bước 4: Test API
Sử dụng Postman hoặc Thunder Client để test các endpoint trong file README.md

## 🌟 Tính Năng Nổi Bật

1. **Clean Architecture**: Phân lớp rõ ràng, dễ maintain và scale
2. **Type Safety**: Prisma provides type-safe database access
3. **Security**: Bcrypt password hashing, JWT authentication
4. **Error Handling**: Comprehensive error handling throughout
5. **Standardized Responses**: Consistent API response format
6. **Database Migrations**: Easy schema management with Prisma
7. **Vietnamese Support**: Full support for Vietnamese characters (NVARCHAR)
8. **Development Tools**: Nodemon for auto-restart, Prisma Studio for DB GUI

## 🐛 Common Issues & Solutions

### Issue: Can't connect to database
**Solution**: 
- Check SQL Server is running
- Verify DATABASE_URL in .env
- Check firewall settings
- Run: `npm run test:db`

### Issue: Prisma Client not found
**Solution**: 
```bash
npm run prisma:generate
```

### Issue: Tables don't exist
**Solution**: 
```bash
npm run prisma:push
```

### Issue: Token expired
**Solution**: 
- User needs to login again
- Client should handle 401 and redirect to login

## 📚 Tài Liệu Tham Khảo

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT.io](https://jwt.io/)
- [bcrypt Documentation](https://www.npmjs.com/package/bcryptjs)
- [SQL Server Connection Strings](https://www.connectionstrings.com/sql-server/)

## 🎉 Kết Luận

Hệ thống authentication đã được xây dựng hoàn chỉnh với:
- ✅ Kiến trúc phân lớp rõ ràng
- ✅ Bảo mật cao
- ✅ Dễ bảo trì và mở rộng
- ✅ Documentation đầy đủ
- ✅ Sẵn sàng tích hợp với Android app

**Next Steps:**
1. Test tất cả các API endpoints
2. Tích hợp với Android app
3. Thêm các tính năng khác (Wallets, Transactions, Categories, Budgets)
4. Deploy lên production server

---

**Made with ❤️ for QLCT App**
