# Quick Start Guide - API Testing

## 1. Chuẩn bị

### Khởi động server
```bash
node server.js
```

Server sẽ chạy tại: `http://localhost:3000`

---

## 2. Đăng ký & Đăng nhập

### Đăng ký tài khoản mới
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "full_name": "Nguyễn Văn A"
  }'
```

### Đăng nhập
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "full_name": "Nguyễn Văn A"
    }
  }
}
```

**⚠️ LƯU Ý: Copy token từ response và sử dụng cho các request tiếp theo!**

---

## 3. Thiết lập Environment Variable

Để test dễ hơn, export token thành biến môi trường:

### Linux/Mac
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Windows CMD
```cmd
set TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Windows PowerShell
```powershell
$env:TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 4. Test Workflow (Theo thứ tự)

### Bước 1: Tạo Danh mục (Categories)

#### Tạo danh mục "Lương"
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lương",
    "type": "income",
    "icon_name": "salary_icon"
  }'
```

#### Tạo danh mục "Ăn uống"
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ăn uống",
    "type": "expense",
    "icon_name": "food_icon"
  }'
```

#### Tạo danh mục "Mua sắm"
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mua sắm",
    "type": "expense",
    "icon_name": "shopping_icon"
  }'
```

#### Lấy tất cả danh mục
```bash
curl -X GET http://localhost:3000/api/categories \
  -H "Authorization: Bearer $TOKEN"
```

**⚠️ LƯU Ý: Lưu lại các category_id để sử dụng cho bước sau!**

---

### Bước 2: Tạo Ví (Wallets)

#### Tạo ví "Tiền mặt"
```bash
curl -X POST http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ví A",
    "initial_balance": 500000,
    "currency": "VND",
    "icon_id": "wallet_cash"
  }'
```

#### Tạo ví "Ngân hàng"
```bash
curl -X POST http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vietcombank",
    "initial_balance": 5000000,
    "currency": "VND",
    "icon_id": "bank_icon"
  }'
```

#### Lấy tất cả ví
```bash
curl -X GET http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN"
```

**Response sẽ bao gồm `current_balance` (số dư hiện tại):**
```json
{
  "success": true,
  "message": "Lấy danh sách ví thành công",
  "data": [
    {
      "id": "wallet-uuid-1",
      "name": "Ví A",
      "initial_balance": "500000",
      "current_balance": "500000",
      "currency": "VND",
      ...
    },
    {
      "id": "wallet-uuid-2",
      "name": "Vietcombank",
      "initial_balance": "5000000",
      "current_balance": "5000000",
      "currency": "VND",
      ...
    }
  ]
}
```

**⚠️ LƯU Ý: Lưu lại wallet_id để sử dụng cho bước sau!**

---

### Bước 3: Tạo Giao dịch (Transactions)

Giả sử:
- `WALLET_ID` = id của ví "Ví A"
- `CATEGORY_INCOME_ID` = id của category "Lương"
- `CATEGORY_FOOD_ID` = id của category "Ăn uống"
- `CATEGORY_SHOPPING_ID` = id của category "Mua sắm"

#### Tạo giao dịch Thu nhập (Income)
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_id": "WALLET_ID",
    "category_id": "CATEGORY_INCOME_ID",
    "amount": 1200000,
    "type": "income",
    "transaction_date": "2026-04-03T10:00:00Z",
    "note": "Lương tháng 4"
  }'
```

#### Tạo giao dịch Chi tiêu 1 (Ăn uống)
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_id": "WALLET_ID",
    "category_id": "CATEGORY_FOOD_ID",
    "amount": 50000,
    "type": "expense",
    "transaction_date": "2026-04-03T12:00:00Z",
    "note": "Ăn trưa"
  }'
```

#### Tạo giao dịch Chi tiêu 2 (Mua sắm)
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_id": "WALLET_ID",
    "category_id": "CATEGORY_SHOPPING_ID",
    "amount": 150000,
    "type": "expense",
    "transaction_date": "2026-04-03T15:00:00Z",
    "note": "Mua quần áo"
  }'
```

---

### Bước 4: Kiểm tra số dư

#### Lấy thông tin ví để xem số dư
```bash
curl -X GET http://localhost:3000/api/wallets/WALLET_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected balance calculation:**
- Initial balance: 500,000
- + Income: 1,200,000
- - Expense 1: 50,000
- - Expense 2: 150,000
- **= Current balance: 1,500,000**

**Response:**
```json
{
  "success": true,
  "message": "Lấy thông tin ví thành công",
  "data": {
    "id": "WALLET_ID",
    "name": "Ví A",
    "initial_balance": "500000",
    "current_balance": "1500000",
    "currency": "VND",
    ...
  }
}
```

---

### Bước 5: Xem danh sách giao dịch

#### Lấy tất cả giao dịch
```bash
curl -X GET http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN"
```

#### Lấy giao dịch theo ví
```bash
curl -X GET http://localhost:3000/api/transactions/wallet/WALLET_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### Lấy chỉ giao dịch chi tiêu
```bash
curl -X GET "http://localhost:3000/api/transactions?type=expense" \
  -H "Authorization: Bearer $TOKEN"
```

#### Lấy giao dịch theo khoảng thời gian
```bash
curl -X GET "http://localhost:3000/api/transactions?start_date=2026-04-01&end_date=2026-04-30" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Bước 6: Xem thống kê

#### Lấy thống kê tháng 4
```bash
curl -X GET "http://localhost:3000/api/transactions/wallet/WALLET_ID/statistics?start_date=2026-04-01&end_date=2026-04-30" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Lấy thống kê thành công",
  "data": {
    "total_income": "1200000",
    "total_expense": "200000",
    "balance": "1000000",
    "transaction_count": 3
  }
}
```

---

### Bước 7: Cập nhật & Xóa

#### Cập nhật giao dịch
```bash
curl -X PUT http://localhost:3000/api/transactions/TRANSACTION_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 75000,
    "note": "Ăn trưa - Updated"
  }'
```

#### Xóa giao dịch
```bash
curl -X DELETE http://localhost:3000/api/transactions/TRANSACTION_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### Cập nhật ví
```bash
curl -X PUT http://localhost:3000/api/wallets/WALLET_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ví A - Updated",
    "initial_balance": 600000
  }'
```

#### Xóa ví (soft delete)
```bash
curl -X DELETE http://localhost:3000/api/wallets/WALLET_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. Testing với Postman

### Import Collection

1. Mở Postman
2. Create new Collection: "QLCT APIs"
3. Add requests theo các ví dụ trên
4. Tạo Environment với variable `token`

### Environment Setup

Tạo environment "QLCT Dev" với variables:
```
base_url = http://localhost:3000/api
token = (paste JWT token here after login)
wallet_id = (paste wallet id after creating)
category_id = (paste category id after creating)
```

Sau đó trong các request, sử dụng:
- URL: `{{base_url}}/wallets`
- Header: `Authorization: Bearer {{token}}`
- Body: `"wallet_id": "{{wallet_id}}"`

---

## 6. Common Issues & Solutions

### Issue 1: Token expired
**Error:** `401 Unauthorized - Token không hợp lệ hoặc đã hết hạn`

**Solution:** Login lại để lấy token mới

---

### Issue 2: Wallet not found
**Error:** `404 Not Found - Không tìm thấy ví`

**Solution:** Kiểm tra lại wallet_id, đảm bảo wallet thuộc về user hiện tại

---

### Issue 3: Invalid amount
**Error:** `400 Bad Request - Số tiền phải lớn hơn 0`

**Solution:** Kiểm tra lại amount > 0

---

## 7. Next Steps

Sau khi test xong, bạn có thể:

1. **Tích hợp với Android app:**
   - Sử dụng Retrofit hoặc OkHttp
   - Lưu token vào SharedPreferences
   - Gọi các API endpoints

2. **Thêm tính năng mới:**
   - Budget management
   - Recurring transactions
   - Reports & charts
   - Export to CSV/PDF

3. **Deploy lên production:**
   - Sử dụng HTTPS
   - Thêm rate limiting
   - Setup monitoring & logging

---

## 8. Full Workflow Example Script

```bash
#!/bin/bash

# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Create Category
CATEGORY=$(curl -s -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Lương","type":"income","icon_name":"salary"}' \
  | jq -r '.data.id')

echo "Category ID: $CATEGORY"

# 3. Create Wallet
WALLET=$(curl -s -X POST http://localhost:3000/api/wallets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ví A","initial_balance":500000,"currency":"VND"}' \
  | jq -r '.data.id')

echo "Wallet ID: $WALLET"

# 4. Create Transaction
TRANSACTION=$(curl -s -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"wallet_id\":\"$WALLET\",\"category_id\":\"$CATEGORY\",\"amount\":1200000,\"type\":\"income\",\"note\":\"Lương\"}" \
  | jq -r '.data.id')

echo "Transaction ID: $TRANSACTION"

# 5. Get Wallet Balance
curl -s -X GET http://localhost:3000/api/wallets/$WALLET \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.current_balance'

# 6. Get Statistics
curl -s -X GET "http://localhost:3000/api/transactions/wallet/$WALLET/statistics?start_date=2026-04-01&end_date=2026-04-30" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
```

Lưu script trên vào file `test.sh` và chạy:
```bash
chmod +x test.sh
./test.sh
```

---

**🎉 Chúc bạn test thành công!**
