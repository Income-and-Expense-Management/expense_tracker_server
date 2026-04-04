# API Documentation - Quản Lý Chi Tiêu

## Authentication APIs (Xác thực)

### 1. Đăng nhập bằng Google
**POST** `/api/auth/google`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "full_name": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id_token | string | ✅ | Google ID Token từ Android Credential Manager |
| full_name | string | ❌ | Tên hiển thị của user |
| email | string | ✅ | Email Google của user |

**Response (200):**
```json
{
  "success": true,
  "message": "Đăng nhập Google thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "nguyenvana@gmail.com",
      "full_name": "Nguyễn Văn A",
      "avatar_url": "https://lh3.googleusercontent.com/a/...",
      "auth_provider": "google",
      "created_at": "2026-04-03T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400`: "Google ID token là bắt buộc", "Email là bắt buộc", "Email không hợp lệ"
- `401`: "Google token không hợp lệ hoặc đã hết hạn"

**Note:** Xem chi tiết tại [GOOGLE_AUTH_DOCUMENTATION.md](./GOOGLE_AUTH_DOCUMENTATION.md)

---

## Wallet APIs (Quản lý Ví)

### 1. Tạo ví mới
**POST** `/api/wallets`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Ví A",
  "initial_balance": 500000,
  "currency": "VND",
  "icon_id": "wallet_icon_1"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Tạo ví thành công",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Ví A",
    "initial_balance": "500000",
    "currency": "VND",
    "icon_id": "wallet_icon_1",
    "created_at": "2026-04-03T...",
    "updated_at": "2026-04-03T...",
    "is_active": true
  }
}
```

---

### 2. Lấy danh sách tất cả ví
**GET** `/api/wallets`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách ví thành công",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Ví A",
      "initial_balance": "500000",
      "current_balance": "1200000",
      "currency": "VND",
      "icon_id": "wallet_icon_1",
      "created_at": "2026-04-03T...",
      "updated_at": "2026-04-03T...",
      "is_active": true
    }
  ]
}
```

---

### 3. Lấy thông tin chi tiết 1 ví
**GET** `/api/wallets/:walletId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin ví thành công",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Ví A",
    "initial_balance": "500000",
    "current_balance": "1200000",
    "currency": "VND",
    "icon_id": "wallet_icon_1",
    "created_at": "2026-04-03T...",
    "updated_at": "2026-04-03T...",
    "is_active": true
  }
}
```

---

### 4. Cập nhật ví
**PUT** `/api/wallets/:walletId`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Ví A - Updated",
  "initial_balance": 600000,
  "currency": "VND",
  "icon_id": "wallet_icon_2"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cập nhật ví thành công",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Ví A - Updated",
    "initial_balance": "600000",
    "currency": "VND",
    "icon_id": "wallet_icon_2",
    "created_at": "2026-04-03T...",
    "updated_at": "2026-04-03T...",
    "is_active": true
  }
}
```

---

### 5. Xóa ví (soft delete)
**DELETE** `/api/wallets/:walletId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Xóa ví thành công",
  "data": {
    "message": "Xóa ví thành công"
  }
}
```

---

## Transaction APIs (Quản lý Giao dịch)

### 1. Tạo giao dịch mới
**POST** `/api/transactions`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "wallet_id": "uuid",
  "category_id": "uuid",
  "amount": 50000,
  "type": "expense",
  "transaction_date": "2026-04-03T10:00:00Z",
  "icon_id": "food_icon",
  "note": "Ăn uống"
}
```

**Các loại type:**
- `income`: Thu nhập
- `expense`: Chi tiêu

**Response (201):**
```json
{
  "success": true,
  "message": "Tạo giao dịch thành công",
  "data": {
    "id": "uuid",
    "wallet_id": "uuid",
    "category_id": "uuid",
    "amount": "50000",
    "type": "expense",
    "transaction_date": "2026-04-03T10:00:00Z",
    "icon_id": "food_icon",
    "note": "Ăn uống",
    "created_at": "2026-04-03T...",
    "updated_at": "2026-04-03T..."
  }
}
```

---

### 2. Lấy tất cả giao dịch
**GET** `/api/transactions`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (optional):**
- `type`: income hoặc expense
- `category_id`: uuid của category
- `wallet_id`: uuid của wallet
- `start_date`: 2026-04-01
- `end_date`: 2026-04-30

**Example:**
```
GET /api/transactions?type=expense&start_date=2026-04-01&end_date=2026-04-30
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách giao dịch thành công",
  "data": [
    {
      "id": "uuid",
      "wallet_id": "uuid",
      "category_id": "uuid",
      "amount": "50000",
      "type": "expense",
      "transaction_date": "2026-04-03T10:00:00Z",
      "icon_id": "food_icon",
      "note": "Ăn uống",
      "created_at": "2026-04-03T...",
      "updated_at": "2026-04-03T..."
    }
  ]
}
```

---

### 3. Lấy giao dịch theo ví
**GET** `/api/transactions/wallet/:walletId`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (optional):**
- `type`: income hoặc expense
- `category_id`: uuid của category
- `start_date`: 2026-04-01
- `end_date`: 2026-04-30

**Response (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách giao dịch thành công",
  "data": [...]
}
```

---

### 4. Lấy thống kê giao dịch theo ví
**GET** `/api/transactions/wallet/:walletId/statistics`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (optional):**
- `start_date`: 2026-04-01
- `end_date`: 2026-04-30

**Response (200):**
```json
{
  "success": true,
  "message": "Lấy thống kê thành công",
  "data": {
    "total_income": "1200000",
    "total_expense": "500000",
    "balance": "700000",
    "transaction_count": 15
  }
}
```

---

### 5. Lấy chi tiết 1 giao dịch
**GET** `/api/transactions/:transactionId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin giao dịch thành công",
  "data": {
    "id": "uuid",
    "wallet_id": "uuid",
    "category_id": "uuid",
    "amount": "50000",
    "type": "expense",
    "transaction_date": "2026-04-03T10:00:00Z",
    "icon_id": "food_icon",
    "note": "Ăn uống",
    "created_at": "2026-04-03T...",
    "updated_at": "2026-04-03T..."
  }
}
```

---

### 6. Cập nhật giao dịch
**PUT** `/api/transactions/:transactionId`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "category_id": "uuid",
  "amount": 60000,
  "type": "expense",
  "transaction_date": "2026-04-03T11:00:00Z",
  "icon_id": "shopping_icon",
  "note": "Mua sắm"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cập nhật giao dịch thành công",
  "data": {
    "id": "uuid",
    "wallet_id": "uuid",
    "category_id": "uuid",
    "amount": "60000",
    "type": "expense",
    "transaction_date": "2026-04-03T11:00:00Z",
    "icon_id": "shopping_icon",
    "note": "Mua sắm",
    "created_at": "2026-04-03T...",
    "updated_at": "2026-04-03T..."
  }
}
```

---

### 7. Xóa giao dịch
**DELETE** `/api/transactions/:transactionId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Xóa giao dịch thành công",
  "data": {
    "message": "Xóa giao dịch thành công"
  }
}
```

---

## Category APIs (Quản lý Danh mục)

### 1. Tạo danh mục mới
**POST** `/api/categories`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Ăn uống",
  "type": "expense",
  "icon_name": "food_icon"
}
```

**Các loại type:**
- `income`: Danh mục thu nhập
- `expense`: Danh mục chi tiêu

**Response (201):**
```json
{
  "success": true,
  "message": "Tạo danh mục thành công",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Ăn uống",
    "type": "expense",
    "icon_name": "food_icon"
  }
}
```

---

### 2. Lấy tất cả danh mục
**GET** `/api/categories`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters (optional):**
- `type`: income hoặc expense

**Example:**
```
GET /api/categories?type=expense
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách danh mục thành công",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Ăn uống",
      "type": "expense",
      "icon_name": "food_icon"
    },
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Mua sắm",
      "type": "expense",
      "icon_name": "shopping_icon"
    }
  ]
}
```

---

### 3. Lấy chi tiết danh mục
**GET** `/api/categories/:categoryId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin danh mục thành công",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Ăn uống",
    "type": "expense",
    "icon_name": "food_icon"
  }
}
```

---

### 4. Cập nhật danh mục
**PUT** `/api/categories/:categoryId`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Ăn uống - Updated",
  "type": "expense",
  "icon_name": "food_new_icon"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cập nhật danh mục thành công",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Ăn uống - Updated",
    "type": "expense",
    "icon_name": "food_new_icon"
  }
}
```

---

### 5. Xóa danh mục
**DELETE** `/api/categories/:categoryId`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Xóa danh mục thành công",
  "data": {
    "message": "Xóa danh mục thành công"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Số tiền phải lớn hơn 0"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập ví này"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Không tìm thấy giao dịch"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Có lỗi xảy ra trên server"
}
```

---

## Notes

1. **Authorization**: Tất cả các API đều yêu cầu JWT token trong header `Authorization: Bearer {token}`
2. **BigInt**: Các trường số tiền (`amount`, `balance`) được trả về dạng string để tránh lỗi khi làm việc với số lớn
3. **Soft Delete**: Xóa ví sử dụng soft delete (is_active = false), không xóa vĩnh viễn khỏi database
4. **Current Balance**: Số dư hiện tại được tính dựa trên `initial_balance` + tổng `income` - tổng `expense`
