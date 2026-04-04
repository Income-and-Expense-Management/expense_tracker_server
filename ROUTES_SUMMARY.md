# API Routes Summary - Quản Lý Chi Tiêu

## Tổng quan API Endpoints

Tất cả API endpoints đều có prefix `/api`

---

## 1. Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | ❌ | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | ❌ | Đăng nhập |
| POST | `/api/auth/logout` | ✅ | Đăng xuất |
| GET | `/api/auth/profile` | ✅ | Lấy thông tin profile |
| PUT | `/api/auth/profile` | ✅ | Cập nhật profile |
| PUT | `/api/auth/change-password` | ✅ | Đổi mật khẩu |

---

## 2. Wallet Routes (`/api/wallets`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/wallets` | ✅ | Tạo ví mới |
| GET | `/api/wallets` | ✅ | Lấy tất cả ví của user |
| GET | `/api/wallets/:walletId` | ✅ | Lấy chi tiết 1 ví |
| PUT | `/api/wallets/:walletId` | ✅ | Cập nhật ví |
| DELETE | `/api/wallets/:walletId` | ✅ | Xóa ví (soft delete) |

**Note:** API `GET /api/wallets` và `GET /api/wallets/:walletId` đều trả về `current_balance` được tính tự động từ các giao dịch.

---

## 3. Transaction Routes (`/api/transactions`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/transactions` | ✅ | Tạo giao dịch mới |
| GET | `/api/transactions` | ✅ | Lấy tất cả giao dịch |
| GET | `/api/transactions/:transactionId` | ✅ | Lấy chi tiết 1 giao dịch |
| PUT | `/api/transactions/:transactionId` | ✅ | Cập nhật giao dịch |
| DELETE | `/api/transactions/:transactionId` | ✅ | Xóa giao dịch |
| GET | `/api/transactions/wallet/:walletId` | ✅ | Lấy giao dịch theo ví |
| GET | `/api/transactions/wallet/:walletId/statistics` | ✅ | Lấy thống kê theo ví |

**Query Parameters cho GET:**
- `type`: income hoặc expense
- `category_id`: uuid
- `wallet_id`: uuid (chỉ dùng với `/api/transactions`)
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD

---

## 4. Category Routes (`/api/categories`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/categories` | ✅ | Tạo danh mục mới |
| GET | `/api/categories` | ✅ | Lấy tất cả danh mục |
| GET | `/api/categories/:categoryId` | ✅ | Lấy chi tiết 1 danh mục |
| PUT | `/api/categories/:categoryId` | ✅ | Cập nhật danh mục |
| DELETE | `/api/categories/:categoryId` | ✅ | Xóa danh mục |

**Query Parameters cho GET:**
- `type`: income hoặc expense

---

## Cấu trúc Project

```
QLCT_Server/
├── config/              # Cấu hình
├── controllers/         # Controllers xử lý request/response
│   ├── authController.js
│   ├── walletController.js
│   ├── transactionController.js
│   └── categoryController.js
├── middleware/          # Middleware (auth, logging, validation)
│   ├── authMiddleware.js
│   ├── requestLogger.js
│   └── validateRequest.js
├── repositories/        # Data access layer (tương tác với DB)
│   ├── userRepository.js
│   ├── walletRepository.js
│   ├── transactionRepository.js
│   └── categoryRepository.js
├── routes/              # Route definitions
│   ├── authRoutes.js
│   ├── walletRoutes.js
│   ├── transactionRoutes.js
│   └── categoryRoutes.js
├── services/            # Business logic layer
│   ├── authService.js
│   ├── walletService.js
│   ├── transactionService.js
│   └── categoryService.js
├── utils/               # Utility functions
│   ├── jwtUtils.js
│   ├── passwordUtils.js
│   └── responseUtils.js
├── prisma/              # Prisma schema & migrations
│   └── schema.prisma
├── server.js            # Entry point
├── package.json
└── .env
```

---

## Kiến trúc Layered Architecture

```
Request → Routes → Controller → Service → Repository → Database
                       ↓
                   Response
```

### 1. **Routes Layer**
- Định nghĩa endpoints
- Apply middleware (auth, validation)

### 2. **Controller Layer**
- Nhận request, validate input
- Gọi service
- Xử lý response (success/error)

### 3. **Service Layer**
- Business logic
- Authorization checks
- Data transformation
- Orchestrate multiple repositories

### 4. **Repository Layer**
- Database queries
- CRUD operations
- Data access only

### 5. **Utils**
- Reusable helper functions
- JWT, password hashing, response formatting

---

## Authentication Flow

1. User gửi request với JWT token trong header:
   ```
   Authorization: Bearer <token>
   ```

2. `authMiddleware` verify token và attach user info vào `req.user`

3. Controller sử dụng `req.user.userId` để lấy thông tin user

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Thành công",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Mô tả lỗi"
}
```

---

## Database Schema

### Users
- id, full_name, email, password, avatar_url, auth_provider, created_at

### Wallets
- id, user_id, name, initial_balance, currency, icon_id, created_at, updated_at, is_active

### Transactions
- id, wallet_id, category_id, amount, type (income/expense), transaction_date, icon_id, note, created_at, updated_at

### Categories
- id, user_id, name, type (income/expense), icon_name

### Budgets
- id, wallet_id, category_id, target_amount, start_date, end_date

---

## Các File Documentation

- **API_DOCUMENTATION.md**: Tài liệu chi tiết về tất cả API endpoints
- **TEST_CASES.md**: Các test case với curl commands
- **ROUTES_SUMMARY.md**: File này - Tổng quan về routes và architecture

---

## How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup .env file:
   ```
   DATABASE_URL="sqlserver://..."
   JWT_SECRET="your-secret-key"
   PORT=3000
   NODE_ENV=development
   ```

3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

4. Run server:
   ```bash
   npm start
   # or
   node server.js
   ```

Server sẽ chạy tại: `http://localhost:3000`

---

## Testing với Postman/Insomnia

1. **Đăng ký/Đăng nhập** để lấy JWT token
2. **Lưu token** vào Environment variables
3. **Thêm token vào header** của mỗi request:
   ```
   Authorization: Bearer {{token}}
   ```
4. Test các endpoints theo thứ tự:
   - Tạo Categories
   - Tạo Wallets
   - Tạo Transactions
   - Lấy Statistics

---

## Important Notes

1. **BigInt handling**: Các trường số tiền được lưu dưới dạng BigInt trong SQL Server, nhưng được convert sang string khi trả về API để tránh overflow

2. **Soft Delete**: Wallet sử dụng soft delete (`is_active = false`), không xóa vĩnh viễn

3. **Authorization**: Tất cả API đều check quyền truy cập - user chỉ có thể thao tác trên data của mình

4. **Validation**: Input được validate ở cả Controller và Service layer

5. **Error Handling**: Tất cả errors được catch và trả về format nhất quán

---

## Next Steps

Có thể mở rộng thêm:
- Budget management (đã có schema)
- Recurring transactions (giao dịch định kỳ)
- Reports & Analytics
- Export data (CSV, PDF)
- Push notifications
- Multi-currency support
