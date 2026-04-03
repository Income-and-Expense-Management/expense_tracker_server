# ⚠️ LỖI ĐÃ FIX - PRISMA 7 DOWNGRADE TO PRISMA 5

## Vấn Đề Gặp Phải

Prisma 7 có cấu trúc khác hoàn toàn và yêu cầu adapter cho SQL Server, gây lỗi:
```
PrismaClientConstructorValidationError: Using engine type "client" requires either "adapter" or "accelerateUrl"
```

## Giải Pháp Đã Áp Dụng

✅ **Downgrade từ Prisma 7.6.0 về Prisma 5.22.0** - phiên bản ổn định hơn với SQL Server

## Các Thay Đổi

1. **Uninstall Prisma 7:**
   ```bash
   npm uninstall prisma @prisma/client
   ```

2. **Install Prisma 5:**
   ```bash
   npm install prisma@5.22.0 @prisma/client@5.22.0
   ```

3. **Xóa file `prisma.config.ts`** - không cần cho Prisma 5

4. **Cập nhật `prisma/schema.prisma`** - thêm lại `url = env("DATABASE_URL")`

5. **Cập nhật `config/database.js`** - loại bỏ adapter

## Bước Tiếp Theo

### ⚠️ QUAN TRỌNG: Chạy SQL Script Để Thêm Password Column

Database hiện tại **THIẾU CỘT PASSWORD** trong bảng users. Bạn cần chạy SQL script để thêm:

**Option 1: Chạy SQL Script (Khuyến nghị)**
```bash
# File: prisma/add-password-column.sql
# Mở SQL Server Management Studio và chạy script này
```

**Option 2: Chạy lệnh SQL trực tiếp**
```sql
ALTER TABLE users ADD password VARCHAR(255) NULL;
```

### Sau Khi Thêm Cột Password

1. **Pull schema mới từ database:**
   ```bash
   npx prisma db pull
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Restart server:**
   ```bash
   npm run dev
   ```

## Test Server

```bash
# Test root endpoint
curl http://localhost:3000

# Test register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","password":"123456","full_name":"Test User"}'
```

## Status

- ✅ Server đang chạy tại http://localhost:3000
- ✅ Database connection thành công
- ⚠️ Cần thêm password column vào bảng users
- ⚠️ Cần thêm foreign key constraints (optional, xem script)

## Package Versions

```json
{
  "prisma": "^5.22.0",
  "@prisma/client": "^5.22.0"
}
```

---

**Lưu ý:** Prisma 7 mới ra và chưa hoàn toàn ổn định với SQL Server. Prisma 5 là lựa chọn tốt hơn cho production.
