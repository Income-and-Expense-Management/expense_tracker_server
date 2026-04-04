# 🔐 Google Sign-In Integration Documentation

## Tổng Quan

Tài liệu này mô tả chi tiết cách tích hợp đăng nhập Google giữa Android app và Node.js server.

---

## 📱 Luồng Xử Lý (Flow)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ANDROID APP                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. User nhấn "Sign in with Google"                                        │
│                    │                                                        │
│                    ▼                                                        │
│  2. GoogleSignInHelper khởi tạo CredentialManager                          │
│     - Sử dụng Web Client ID                                                 │
│     - setFilterByAuthorizedAccounts(false)                                  │
│                    │                                                        │
│                    ▼                                                        │
│  3. Hiển thị Google Account Picker                                         │
│     - User chọn tài khoản Google                                           │
│                    │                                                        │
│                    ▼                                                        │
│  4. GoogleIdTokenCredential được trả về                                    │
│     - idToken: JWT token từ Google                                          │
│     - displayName: Tên hiển thị                                             │
│     - email: Email Google                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP POST /api/auth/google
                                    │ Body: { id_token, full_name, email }
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NODE.JS SERVER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  5. AuthController.loginWithGoogle()                                       │
│     - Validate input                                                        │
│                    │                                                        │
│                    ▼                                                        │
│  6. AuthService.loginWithGoogle()                                          │
│     - Verify Google ID token với Google API                                 │
│     - Trích xuất thông tin user từ token                                   │
│                    │                                                        │
│                    ▼                                                        │
│  7. Check user trong database                                              │
│     ┌──────────────┴──────────────┐                                        │
│     │                             │                                         │
│     ▼                             ▼                                         │
│  User tồn tại?              User không tồn tại?                            │
│     │                             │                                         │
│     │ Update info                 │ Create new user                        │
│     │ (avatar, name)              │ auth_provider: 'google'                │
│     │                             │                                         │
│     └──────────────┬──────────────┘                                        │
│                    │                                                        │
│                    ▼                                                        │
│  8. Generate JWT token                                                      │
│     - Include userId, email                                                 │
│                    │                                                        │
│                    ▼                                                        │
│  9. Return response                                                         │
│     { token, user }                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP Response
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ANDROID APP                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  10. AuthRepositoryImpl.handleAuthSuccess()                                │
│      - Parse response                                                       │
│      - Save token to TokenStorage                                           │
│      - Save user info                                                       │
│                    │                                                        │
│                    ▼                                                        │
│  11. Navigate to MainActivity                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Cấu Hình Server

### 1. Cài đặt Dependencies

```bash
npm install google-auth-library
```

### 2. Cấu hình Environment Variables

Thêm vào file `.env`:

```env
# Google OAuth2 - Lấy từ Google Cloud Console
# QUAN TRỌNG: Sử dụng Web Client ID (không phải Android Client ID)
GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"

# Development mode - cho phép bỏ qua verification nghiêm ngặt
GOOGLE_AUTH_LENIENT="true"
```

### 3. Lấy Google Client ID

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo hoặc chọn project
3. Vào **APIs & Services** > **Credentials**
4. Tạo **OAuth 2.0 Client ID** loại **Web application**
5. Copy Client ID vào `.env`

**Lưu ý quan trọng:**
- Android app sử dụng **Web Client ID** (không phải Android Client ID) khi cấu hình `GetGoogleIdOption.setServerClientId()`
- Server cũng sử dụng cùng **Web Client ID** này để verify token

---

## 📡 API Endpoint

### POST `/api/auth/google`

**Description:** Đăng nhập hoặc đăng ký bằng tài khoản Google

**Authentication:** Không yêu cầu (Public endpoint)

**Request Headers:**
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
| id_token | string | ✅ Yes | Google ID Token từ Credential Manager |
| full_name | string | ❌ No | Tên hiển thị của user |
| email | string | ✅ Yes | Email Google của user |

**Success Response (200):**
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

| Status | Message | Description |
|--------|---------|-------------|
| 400 | "Google ID token là bắt buộc" | Missing id_token |
| 400 | "Email là bắt buộc" | Missing email |
| 400 | "Email không hợp lệ" | Invalid email format |
| 401 | "Google token không hợp lệ hoặc đã hết hạn" | Token verification failed |
| 500 | "Có lỗi xảy ra trên server" | Server error |

---

## 📁 Files Đã Tạo/Cập Nhật

### Files Mới:

| File | Description |
|------|-------------|
| `utils/googleAuthUtils.js` | Google token verification utility |
| `GOOGLE_AUTH_DOCUMENTATION.md` | Documentation này |

### Files Cập Nhật:

| File | Changes |
|------|---------|
| `services/authService.js` | Thêm method `loginWithGoogle()` |
| `controllers/authController.js` | Thêm method `loginWithGoogle()` |
| `routes/authRoutes.js` | Thêm route `POST /google` |
| `.env` | Thêm `GOOGLE_CLIENT_ID`, `GOOGLE_AUTH_LENIENT` |

---

## 🔐 Security Considerations

### 1. Token Verification

Server luôn verify Google ID token trước khi tin tưởng:

```javascript
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const ticket = await client.verifyIdToken({
  idToken: idToken,
  audience: GOOGLE_CLIENT_ID,
});
```

### 2. Email Validation

- Verify email từ token khớp với email gửi lên
- Kiểm tra `email_verified` từ Google payload

### 3. Lenient Mode (Development Only)

Trong development, có thể bật `GOOGLE_AUTH_LENIENT=true` để:
- Bỏ qua strict token verification
- Cho phép test với Android Client ID không khớp

**⚠️ KHÔNG BAO GIỜ dùng lenient mode trong production!**

### 4. Password Handling

- Google users không có password (`password: null`)
- Khi user có cả local và Google auth, giữ cả hai methods

---

## 📱 Android Integration

### AndroidManifest.xml

Không cần thêm permission đặc biệt cho Credential Manager API.

### GoogleSignInHelper.java

```java
public class GoogleSignInHelper {
    public void signIn(Activity activity, GoogleSignInCallback callback) {
        GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(webClientId)  // Web Client ID!
            .setAutoSelectEnabled(false)
            .build();
            
        // ... credential manager flow
    }
}
```

### AuthRepositoryImpl.java

```java
public void loginWithGoogle(String idToken, String displayName, 
                           String email, AuthCallback<String> callback) {
    JSONObject body = new JSONObject();
    body.put("id_token", idToken);
    body.put("full_name", displayName);
    body.put("email", email);
    
    // POST to /api/auth/google
}
```

---

## 🧪 Testing

### Test với cURL

```bash
# Test Google Login
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "id_token": "YOUR_GOOGLE_ID_TOKEN",
    "full_name": "Test User",
    "email": "testuser@gmail.com"
  }'
```

### Test Flow

1. Sử dụng Android app để đăng nhập Google
2. Capture network request để lấy id_token
3. Test trực tiếp với server bằng curl hoặc Postman

### Mock Testing (Development)

Với `GOOGLE_AUTH_LENIENT=true`, có thể tạo mock token:

```javascript
// Decode token structure (for understanding only)
const parts = idToken.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
// payload contains: sub, email, name, picture, etc.
```

---

## 🔄 User Scenarios

### Scenario 1: New Google User

1. User chưa có tài khoản
2. Đăng nhập bằng Google
3. Server tạo user mới với `auth_provider: 'google'`
4. User nhận JWT token và có thể sử dụng app

### Scenario 2: Existing Google User

1. User đã đăng ký bằng Google trước đó
2. Đăng nhập lại bằng Google
3. Server verify token, tìm user theo email
4. Cập nhật avatar nếu có thay đổi
5. Return JWT token

### Scenario 3: Local User Signs In with Google

1. User đã đăng ký bằng email/password
2. Đăng nhập bằng Google (cùng email)
3. Server tìm thấy user với `auth_provider: 'local'`
4. Giữ `auth_provider: 'local'` (user vẫn có thể dùng password)
5. Cập nhật avatar từ Google nếu chưa có
6. Return JWT token

### Scenario 4: Google User Tries Password Login

1. User đăng ký bằng Google
2. Thử đăng nhập bằng email/password
3. Server trả về lỗi: "Tài khoản này sử dụng phương thức đăng nhập khác"

---

## ❗ Troubleshooting

### Error: "Google token không hợp lệ"

**Nguyên nhân có thể:**
1. Token đã hết hạn (thường 1 giờ)
2. Client ID không khớp
3. Token bị modify

**Giải pháp:**
1. Kiểm tra Web Client ID trong Android và Server giống nhau
2. Đảm bảo server có internet để verify với Google
3. Kiểm tra thời gian hệ thống (clock skew)

### Error: "Credential Manager error"

**Nguyên nhân có thể:**
1. Google Play Services chưa cập nhật
2. Device không hỗ trợ
3. SHA-1 fingerprint chưa đăng ký

**Giải pháp:**
1. Cập nhật Google Play Services
2. Đăng ký SHA-1 fingerprint trong Google Cloud Console

### Development: Token Verification Fails

Nếu đang development và gặp lỗi verification:

1. Kiểm tra `GOOGLE_CLIENT_ID` đã set đúng chưa
2. Bật `GOOGLE_AUTH_LENIENT=true` trong `.env`
3. Restart server

---

## 📚 References

- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android)
- [Credential Manager API](https://developer.android.com/training/sign-in/credential-manager)
- [google-auth-library (Node.js)](https://github.com/googleapis/google-auth-library-nodejs)
- [Verify Google ID Tokens](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)

---

## ✅ Checklist

- [x] Install google-auth-library
- [x] Create googleAuthUtils.js
- [x] Add loginWithGoogle to AuthService
- [x] Add loginWithGoogle to AuthController
- [x] Add /google route to AuthRoutes
- [x] Update .env with Google Client ID
- [x] Create documentation
- [x] Handle new user creation
- [x] Handle existing user login
- [x] Handle local+google user merge
- [x] Error handling
- [x] Lenient mode for development

---

**📅 Last Updated:** 2026-04-03

**🔧 Maintained by:** QLCT Server Team
