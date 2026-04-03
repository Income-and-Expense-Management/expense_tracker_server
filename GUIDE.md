# 📋 Hướng Dẫn Sử Dụng Hệ Thống Authentication

## 🎯 Tổng Quan

Hệ thống authentication đã được xây dựng hoàn chỉnh với kiến trúc phân lớp rõ ràng:

```
Client (Android App)
        ↓
    Routes (authRoutes.js)
        ↓
    Middleware (authMiddleware.js)
        ↓
    Controllers (authController.js)
        ↓
    Services (authService.js)
        ↓
    Repositories (userRepository.js)
        ↓
    Database (SQL Server via Prisma)
```

## 🚀 Các Bước Khởi Động

### 1. Cấu hình Database

Mở file `.env` và cập nhật thông tin database của bạn:

```env
DATABASE_URL="sqlserver://localhost:1433;database=QLCT_DB;user=SA;password=YourPassword;encrypt=true;trustServerCertificate=true"
JWT_SECRET="your-super-secret-key-here"
```

### 2. Tạo Database Tables

```bash
# Push schema lên database
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate
```

### 3. Test Kết Nối Database

```bash
npm run test:db
```

Nếu thấy thông báo "✅ Kết nối database thành công!" là OK!

### 4. Chạy Server

```bash
# Development mode
npm run dev

# hoặc Production mode
npm start
```

Server sẽ chạy tại: http://localhost:3000

## 📱 Test API

### Test 1: Đăng Ký User Mới

**Request:**
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@gmail.com",
  "password": "123456",
  "full_name": "Nguyễn Văn Test"
}
```

**Response mong đợi:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "test@gmail.com",
      "full_name": "Nguyễn Văn Test",
      "auth_provider": "local"
    },
    "token": "eyJhbGc..."
  }
}
```

**Lưu lại token** từ response để dùng cho các request tiếp theo!

### Test 2: Đăng Nhập

**Request:**
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@gmail.com",
  "password": "123456"
}
```

### Test 3: Xem Profile (Cần Token)

**Request:**
```bash
GET http://localhost:3000/api/auth/profile
Authorization: Bearer eyJhbGc...
```

### Test 4: Cập Nhật Profile (Cần Token)

**Request:**
```bash
PUT http://localhost:3000/api/auth/profile
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "full_name": "Nguyễn Văn Updated",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### Test 5: Đổi Mật Khẩu (Cần Token)

**Request:**
```bash
PUT http://localhost:3000/api/auth/change-password
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "oldPassword": "123456",
  "newPassword": "newpass123"
}
```

### Test 6: Đăng Xuất (Cần Token)

**Request:**
```bash
POST http://localhost:3000/api/auth/logout
Authorization: Bearer eyJhbGc...
```

## 📂 Chi Tiết Từng File

### 1. **config/database.js**
- Khởi tạo Prisma Client
- Kết nối với SQL Server
- Export để các module khác sử dụng

### 2. **repositories/userRepository.js**
- Data Access Layer
- Các function tương tác trực tiếp với database:
  - `findByEmail()` - Tìm user theo email
  - `findById()` - Tìm user theo ID
  - `create()` - Tạo user mới
  - `update()` - Cập nhật user
  - `delete()` - Xóa user

### 3. **utils/jwtUtils.js**
- `generateToken()` - Tạo JWT token
- `verifyToken()` - Xác thực token
- `decodeToken()` - Giải mã token

### 4. **utils/passwordUtils.js**
- `hashPassword()` - Mã hóa password với bcrypt
- `comparePassword()` - So sánh password với hash

### 5. **utils/responseUtils.js**
- Chuẩn hóa response format
- Các method: `success()`, `error()`, `created()`, `badRequest()`, `unauthorized()`, etc.

### 6. **services/authService.js**
- Business Logic Layer
- Các function:
  - `register()` - Xử lý đăng ký
  - `login()` - Xử lý đăng nhập
  - `getProfile()` - Lấy thông tin user
  - `updateProfile()` - Cập nhật thông tin
  - `changePassword()` - Đổi mật khẩu

### 7. **middleware/authMiddleware.js**
- Middleware xác thực JWT token
- Kiểm tra Authorization header
- Verify token và gắn user info vào `req.user`

### 8. **controllers/authController.js**
- Presentation Layer
- Nhận request từ client
- Gọi service xử lý
- Trả response về client

### 9. **routes/authRoutes.js**
- Define các endpoint
- Gắn middleware vào routes cần bảo vệ
- Map endpoint với controller method

### 10. **server.js**
- Entry point của app
- Setup middleware
- Mount routes
- Error handling
- Start server

## 🔐 Luồng Xác Thực

### Đăng Ký Flow:
```
1. Client gửi email + password
2. authController.register() validate input
3. authService.register() kiểm tra email tồn tại
4. passwordUtils.hashPassword() mã hóa password
5. userRepository.create() lưu vào database
6. jwtUtils.generateToken() tạo token
7. Return user + token về client
```

### Đăng Nhập Flow:
```
1. Client gửi email + password
2. authController.login() validate input
3. authService.login() tìm user theo email
4. passwordUtils.comparePassword() so sánh password
5. jwtUtils.generateToken() tạo token
6. Return user + token về client
```

### Protected Route Flow:
```
1. Client gửi request kèm token trong header
2. authMiddleware verify token
3. Nếu hợp lệ: gắn user info vào req.user, next()
4. Nếu không hợp lệ: return 401 Unauthorized
5. Controller xử lý request với req.user.userId
```

## 🛠 Tích Hợp Với Android

### 1. Setup Retrofit trong Android

```kotlin
// RetrofitClient.kt
object RetrofitClient {
    private const val BASE_URL = "http://10.0.2.2:3000/api/" // Emulator
    // private const val BASE_URL = "http://YOUR_IP:3000/api/" // Real device
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    
    private val client = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .build()
    
    val instance: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
}
```

### 2. Define Data Models

```kotlin
// Models.kt
data class RegisterRequest(
    val email: String,
    val password: String,
    val full_name: String?
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class User(
    val id: String,
    val email: String,
    val full_name: String?,
    val avatar_url: String?,
    val auth_provider: String,
    val created_at: String
)

data class AuthResponse(
    val success: Boolean,
    val message: String,
    val data: AuthData?
)

data class AuthData(
    val user: User,
    val token: String
)
```

### 3. Create API Service

```kotlin
// AuthApiService.kt
interface AuthApiService {
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): AuthResponse
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse
    
    @GET("auth/profile")
    suspend fun getProfile(@Header("Authorization") token: String): UserResponse
    
    @PUT("auth/profile")
    suspend fun updateProfile(
        @Header("Authorization") token: String,
        @Body request: UpdateProfileRequest
    ): UserResponse
}
```

### 4. Use in Repository/ViewModel

```kotlin
// AuthRepository.kt
class AuthRepository {
    private val api = RetrofitClient.instance.create(AuthApiService::class.java)
    
    suspend fun login(email: String, password: String): Result<AuthData> {
        return try {
            val response = api.login(LoginRequest(email, password))
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 5. Save Token

```kotlin
// TokenManager.kt
class TokenManager(context: Context) {
    private val prefs = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
    
    fun saveToken(token: String) {
        prefs.edit().putString("token", token).apply()
    }
    
    fun getToken(): String? {
        return prefs.getString("token", null)
    }
    
    fun clearToken() {
        prefs.edit().remove("token").apply()
    }
}
```

## 🐛 Troubleshooting

### Lỗi: Cannot connect to database
```bash
# Kiểm tra SQL Server đang chạy
# Kiểm tra DATABASE_URL trong .env
# Test kết nối: npm run test:db
```

### Lỗi: Prisma Client not generated
```bash
npm run prisma:generate
```

### Lỗi: Tables don't exist
```bash
npm run prisma:push
```

### Lỗi: Token invalid
- Kiểm tra JWT_SECRET trong .env
- Kiểm tra format header: "Bearer <token>"
- Kiểm tra token chưa hết hạn

## 📞 Support

Nếu gặp vấn đề, hãy kiểm tra:
1. SQL Server đang chạy
2. Database đã được tạo
3. File .env đã cấu hình đúng
4. Đã chạy `npm run prisma:push`
5. Đã chạy `npm run prisma:generate`

Happy coding! 🚀
