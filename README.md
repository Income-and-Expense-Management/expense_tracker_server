# 🏦 QLCT Server - Hệ Thống Quản Lý Chi Tiêu

Server API cho ứng dụng quản lý chi tiêu cá nhân, xây dựng với Node.js, Express, Prisma và SQL Server.

## 📋 Mục Lục

- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [API Documentation](#api-documentation)
- [Chạy server](#chạy-server)

## ✨ Tính Năng

### Xác Thực & Người Dùng
- ✅ Đăng ký tài khoản
- ✅ Đăng nhập với JWT
- ✅ Đăng xuất
- ✅ Xem thông tin cá nhân
- ✅ Cập nhật thông tin cá nhân
- ✅ Đổi mật khẩu

## 🛠 Công Nghệ Sử Dụng

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Prisma** - ORM cho database
- **SQL Server** - Database
- **JWT** - JSON Web Tokens cho authentication
- **bcryptjs** - Mã hóa mật khẩu

## 📁 Cấu Trúc Thư Mục

```
QLCT_Server/
├── config/
│   └── database.js           # Cấu hình Prisma Client
├── controllers/
│   └── authController.js     # Controller xử lý authentication
├── middleware/
│   ├── authMiddleware.js     # Middleware xác thực JWT
│   └── validateRequest.js    # Middleware validate request
├── repositories/
│   └── userRepository.js     # Data access layer cho User
├── routes/
│   └── authRoutes.js         # Định nghĩa routes cho auth
├── services/
│   └── authService.js        # Business logic cho auth
├── utils/
│   ├── jwtUtils.js           # Utility functions cho JWT
│   ├── passwordUtils.js      # Utility functions cho password
│   └── responseUtils.js      # Utility functions cho response
├── prisma/
│   └── schema.prisma         # Database schema
├── .env                      # Environment variables
├── server.js                 # Entry point
└── package.json
```

## 🚀 Cài Đặt

### 1. Clone hoặc tải project về

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cài đặt SQL Server

Đảm bảo bạn đã cài đặt SQL Server và đang chạy.

### 4. Tạo database

```sql
CREATE DATABASE QLCT_DB;
```

### 5. Chạy migration để tạo tables

```bash
npx prisma db push
```

Hoặc nếu bạn đã có database với schema sẵn:

```bash
npx prisma db pull
npx prisma generate
```

## ⚙️ Cấu Hình

Tạo file `.env` trong thư mục root và cấu hình các biến môi trường:

```env
# Database Connection
DATABASE_URL="sqlserver://localhost:1433;database=QLCT_DB;user=SA;password=YourPassword123;encrypt=true;trustServerCertificate=true"

# JWT Secret - QUAN TRỌNG: Thay đổi thành key bảo mật của bạn
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Config
PORT=3000
NODE_ENV="development"
```

### Lưu ý quan trọng:
- **Thay đổi `JWT_SECRET`** thành một chuỗi bảo mật phức tạp
- **Cập nhật thông tin database** cho đúng với SQL Server của bạn
- Không commit file `.env` lên git

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication APIs

#### 1. Đăng Ký
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nguyễn Văn A",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "avatar_url": "https://example.com/avatar.jpg",
      "auth_provider": "local",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Đăng Nhập
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyễn Văn A",
      "avatar_url": "https://example.com/avatar.jpg",
      "auth_provider": "local",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Đăng Xuất
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Đăng xuất thành công",
  "data": null
}
```

#### 4. Xem Thông Tin Cá Nhân
**GET** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin thành công",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A",
    "avatar_url": "https://example.com/avatar.jpg",
    "auth_provider": "local",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 5. Cập Nhật Thông Tin
**PUT** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "full_name": "Nguyễn Văn B",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Cập nhật thông tin thành công",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn B",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "auth_provider": "local",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 6. Đổi Mật Khẩu
**PUT** `/api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công",
  "data": {
    "message": "Đổi mật khẩu thành công"
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "field": "email",
      "message": "Email không hợp lệ"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Không có quyền truy cập"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "message": "Email đã được sử dụng"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Có lỗi xảy ra trên server"
}
```

## 🏃 Chạy Server

### Development mode (với nodemon)
```bash
npm run dev
```

### Production mode
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 🧪 Test API với Postman hoặc cURL

### Test đăng ký
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### Test đăng nhập
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test xem profile (cần token)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📱 Tích Hợp với Android App

### 1. Thêm dependencies trong build.gradle
```gradle
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
implementation 'com.squareup.okhttp3:logging-interceptor:4.9.0'
```

### 2. Tạo API Service trong Android

```kotlin
interface AuthApiService {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @GET("auth/profile")
    suspend fun getProfile(@Header("Authorization") token: String): Response<UserResponse>
}
```

### 3. Sử dụng trong ViewModel

```kotlin
class AuthViewModel : ViewModel() {
    fun login(email: String, password: String) {
        viewModelScope.launch {
            try {
                val response = authApi.login(LoginRequest(email, password))
                if (response.isSuccessful) {
                    val token = response.body()?.data?.token
                    // Lưu token vào SharedPreferences hoặc DataStore
                }
            } catch (e: Exception) {
                // Xử lý lỗi
            }
        }
    }
}
```

## 🔒 Bảo Mật

- Mật khẩu được mã hóa bằng bcrypt với salt rounds = 10
- JWT token có thời gian hết hạn (mặc định 7 ngày)
- Tất cả các route cần authentication đều được bảo vệ bằng middleware
- SQL Injection được ngăn chặn nhờ Prisma ORM

## 📝 Notes

- Password tối thiểu 6 ký tự
- Email phải có format hợp lệ
- Token được gửi trong header với format: `Authorization: Bearer <token>`
- Khi logout, client cần xóa token ở local storage

## 🤝 Contributing

Mọi đóng góp đều được chào đón! Hãy tạo pull request hoặc issue nếu bạn có ý tưởng cải thiện.

## 📄 License

ISC

---

Được xây dựng với ❤️ cho ứng dụng quản lý chi tiêu
