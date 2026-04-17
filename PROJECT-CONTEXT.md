# QLCT Server — Project Master Guide

> **Purpose of this document:** This is the authoritative context document for any AI assistant working on this codebase. Read every section carefully before writing a single line of code. All patterns described here are extracted directly from the existing source files and must be faithfully replicated.

---

## 1. Project Overview & Purpose

**QLCT Server** (Quản Lý Chi Tiêu — Vietnamese for "Expense Management") is a **RESTful JSON API** backend for a personal finance / expense-tracker mobile application (Android client using Google Credential Manager).

### Core Business Logic

- **Users** register/login via email+password or Google OAuth (ID Token flow). JWT tokens are used for stateless session management.
- Each User owns one or more **Wallets** (e.g., "Cash", "Bank Account"). Wallets track an `initial_balance`; the live `current_balance` is computed on-the-fly by summing all transactions.
- **Transactions** belong to a Wallet and are typed as either `income` or `expense`. Each transaction may reference a **Category** for classification.
- **Categories** are user-owned and scoped to a type (`income` | `expense`).
- **Budgets** allow users to set spending targets per wallet+category combination within a date range. The API computes `total_spent` and `remaining` amounts in real-time from actual transactions.
- All monetary values are stored as `BigInt` (SQL Server `bigint`) representing the smallest currency unit (Vietnamese Đồng has no sub-units). `BigInt` values are always serialized to `String` before returning to the client.

### API Base URL Convention

```
/api/v1/<resource>
```

Mounted at `/api` (configured via `BASE_URL` env var). The router applies a `/v1` versioning prefix internally. All resource endpoints are accessible at `/api/v1/<resource>`.

---

## 2. Tech Stack & Key Libraries

| Category | Library / Tool | Version | Role |
|---|---|---|---|
| **Runtime** | Node.js | (LTS) | Server runtime |
| **Framework** | Express.js | `^5.2.1` | HTTP routing & middleware |
| **ORM** | Prisma Client | `^5.22.0` | Database access layer |
| **Database** | Microsoft SQL Server | — | Primary data store (via `sqlserver` Prisma provider) |
| **Auth — JWT** | `jsonwebtoken` | `^9.0.3` | Signing / verifying API tokens |
| **Auth — Google** | `google-auth-library` | `^10.6.2` | Verifying Google ID tokens from Android |
| **Password hashing** | `bcrypt` + `bcryptjs` | `^6.0.0` / `^3.0.3` | Hashing passwords at rest |
| **Env config** | `dotenv` | `^17.4.0` | Loading `.env` into `process.env` |
| **Security** | `helmet` | `^8.1.0` | HTTP security headers |
| **CORS** | `cors` | `^2.8.6` | Cross-origin control (enabled, reads `FRONTEND_URL` env var) |
| **Cookie parsing** | `cookie-parser` | `^1.4.7` | Parsing cookies (set up but not yet used for auth) |
| **HTTP logging** | `morgan` | `^1.10.1` | Request logging in `common` format |
| **Dev server** | `nodemon` | `^3.1.14` | Auto-restart on file change |

> **Note:** Both `bcrypt` and `bcryptjs` are listed as dependencies. The project exclusively uses `passwordUtils` from `utils/passwordUtils.js` which imports `bcrypt` with salt rounds **10**.

---

## 3. Project Structure

```
QLCT_Server/
├── server.js              # Entry point — loads .env, calls app.listen()
├── app.js                 # Express app factory — registers global middleware & mounts the root router
├── package.json           # ESM project ("type": "module"), path alias imports map (#controllers/*, #services/*, #repositories/*, etc.)
│
├── config/
│   └── database.js        # Singleton PrismaClient instance; tests connection on startup
│
├── prisma/
│   └── schema.prisma      # Database schema (models: User, Wallet, Category, Transaction, Budget)
│
├── routes/
│   ├── index.js           # Root router — health check, mounts v1 sub-router with all resource routers
│   ├── authRoutes.js      # /auth — public + protected auth endpoints
│   ├── walletRoutes.js    # /wallets — all protected
│   ├── transactionRoutes.js  # /transactions — all protected
│   ├── categoryRoutes.js  # /categories — all protected
│   └── budgetRoutes.js    # /budgets — all protected
│
├── middleware/
│   ├── authenticateToken.js  # JWT verification; attaches req.user = { userId, email }
│   ├── requestLogger.js      # Debug request/response logger (logs body, redacts Authorization)
│   └── validateRequest.js    # express-validator result consumer — returns 400 on errors
│
├── controllers/
│   ├── authController.js       # Handles HTTP: parses req, validates, calls service, calls ApiResponse
│   ├── walletController.js
│   ├── transactionController.js
│   ├── categoryController.js
│   └── budgetController.js
│
├── services/
│   ├── authService.js          # Business logic: register, login, Google login, profile, change password
│   ├── walletService.js        # Business logic: CRUD, ownership checks, balance computation trigger
│   ├── transactionService.js   # Business logic: CRUD, ownership checks, BigInt conversion
│   ├── categoryService.js      # Business logic: CRUD, type validation, ownership checks
│   └── budgetService.js        # Business logic: CRUD, ownership via wallet, spent vs target computation
│
├── repositories/
│   ├── userRepository.js       # Prisma calls for User model
│   ├── walletRepository.js     # Prisma calls for Wallet model (incl. soft-delete & balance aggregation)
│   ├── transactionRepository.js  # Prisma calls for Transaction (filter by type, date, wallet/user)
│   ├── categoryRepository.js   # Prisma calls for Category model
│   └── budgetRepository.js     # Prisma calls for Budget model (incl. total spent aggregation)
│
└── utils/
    ├── responseUtils.js    # ApiResponse class — the ONLY way to send HTTP responses
    ├── errorMessages.js    # Centralized ERROR_MESSAGES constants for service-controller contract
    ├── logger.js           # Logger singleton (info/warn/error/debug)
    ├── jwtUtils.js         # JwtUtils singleton (generateToken, verifyToken, decodeToken)
    ├── passwordUtils.js    # { hashPassword, comparePassword } — bcrypt, salt=10
    └── googleAuthUtils.js  # verifyGoogleToken / verifyGoogleTokenLenient
```

---

## 4. Architecture & Design Patterns

### 4.1 Layered Architecture (4 Layers)

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  MIDDLEWARE LAYER                                                │
│  (helmet, cors, morgan, cookieParser, express.json, authenticateToken) │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────┐
│   CONTROLLER LAYER     │  • Parses req (body, params, query)
│  controllers/*.js      │  • Validates HTTP-level rules (required fields,
│                        │    format checks, range checks)
│                        │  • Calls Service method
│                        │  • Maps Service errors to ApiResponse methods
│                        │  • NEVER touches Prisma directly
└────────────────────────┘
     │
     ▼
┌────────────────────────┐
│    SERVICE LAYER       │  • Owns business rules (ownership checks, type
│   services/*.js        │    validation, BigInt coercion, password hashing)
│                        │  • Throws plain Error objects with user-facing
│                        │    Vietnamese messages (from ERROR_MESSAGES)
│                        │  • Calls one or more Repositories; never touches
│                        │    Prisma directly
└────────────────────────┘
     │
     ▼
┌────────────────────────┐
│  REPOSITORY LAYER      │  • The ONLY layer that imports and calls Prisma
│  repositories/*.js     │  • Contains all Prisma query logic (findUnique,
│                        │    findMany, create, update, delete)
│                        │  • No business logic — just data access
└────────────────────────┘
     │
     ▼
┌────────────────────────┐
│  DATABASE (SQL Server) │
│  via Prisma Client     │
└────────────────────────┘
```

**Layer communication rules (strict):**
- **Routes → Controllers** only (no direct service calls from routes).
- **Controllers → Services** only.
- **Services → Repositories** only (cross-repository calls within a service are OK, e.g., `transactionService` calls both `walletRepository` and `transactionRepository`).
- **Repositories → Prisma** only.
- No layer may skip a level (e.g., controllers cannot import a repository).

### 4.2 Object Literal Pattern (not Classes for Controllers/Services/Repositories)

Controllers, Services, and Repositories are all defined as **plain object literals** with `async` method properties, then exported as a default or named export:

```js
// ✅ Correct pattern — object literal
export const authService = {
  async register({ email, password }) { ... },
  async login({ email, password }) { ... },
};
export default authService;
```

Utils (`JwtUtils`, `Logger`) are **class instances** (instantiated once and exported as a singleton):

```js
// ✅ Correct pattern — singleton class
class JwtUtils { ... }
export default new JwtUtils();
```

`ApiResponse` is a **static-method class** (never instantiated):
```js
class ApiResponse {
  static success(res, data, message, statusCode) { ... }
  static error(res, message, statusCode, errors) { ... }
}
export default ApiResponse;
```

### 4.3 Authorization: Ownership Checks

There is **no dedicated RBAC middleware**. Ownership is enforced inside the **Service layer** for every resource mutation and read. The pattern is:

```js
// 1. Fetch the resource
const resource = await repository.findById(id);

// 2. Check existence
if (!resource) throw new Error(ERROR_MESSAGES.RESOURCE_NOT_FOUND);

// 3. Check ownership
if (resource.user_id !== userId) throw new Error(ERROR_MESSAGES.RESOURCE_ACCESS_DENIED);

// 4. Proceed with operation
```

### 4.4 Route-Level Auth Strategy

- **Public routes** (no middleware): `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `GET /health`
- **Individually protected routes**: Apply `authenticateToken` per-route: `POST /auth/logout`, `GET /auth/profile`, etc.
- **Fully protected route groups**: Use `router.use(authenticateToken)` at the top of walletRoutes, transactionRoutes, categoryRoutes, and budgetRoutes to blanket-protect all routes in that module.

> All route files correctly import `{ authenticateToken }` from `'../middleware/authenticateToken.js'`.

### 4.5 Module System

The project uses **ES Modules** (`"type": "module"` in `package.json`). All imports use `.js` extensions. Path aliases are configured under `"imports"` in `package.json`:

```json
"#controllers/*": "./controllers/*",
"#services/*":    "./services/*",
"#utils/*":       "./utils/*",
"#routes/*":      "./routes/*",
"#middleware/*":  "./middleware/*",
"#repositories/*":"./repositories/*"
```

Use these aliases when importing across layers to keep paths clean. The `#lib/*` alias is declared but the `lib/` directory does not yet exist.

### 4.6 Error Message Contract (SOA Service Contract)

Services and controllers communicate errors through a centralized `ERROR_MESSAGES` constant object defined in `utils/errorMessages.js`. Services throw `new Error(ERROR_MESSAGES.SOME_KEY)`, and controllers check `error.message === ERROR_MESSAGES.SOME_KEY` to map to the correct HTTP status code.

Every service method has a **JSDoc contract block** specifying `@param`, `@returns`, and `@throws` — this fulfills the SOA requirement for explicit service contracts.

---

## 5. Coding Conventions & Style Guide

### 5.1 Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| Files | `camelCase` | `authController.js`, `responseUtils.js` |
| Controller object | `camelCase` | `const authController = { ... }` |
| Service object | `camelCase` | `export const authService = { ... }` |
| Repository object | `camelCase` | `const userRepository = { ... }` |
| Utility classes | `PascalCase` | `class JwtUtils { ... }` |
| Exported utility instances | `camelCase` | `export default new JwtUtils()` |
| Database field names | `snake_case` | `user_id`, `full_name`, `created_at` |
| Route param names | `camelCase` | `:walletId`, `:transactionId`, `:categoryId`, `:budgetId` |
| Query string params | `snake_case` | `?start_date=`, `?category_id=` |
| Request body fields | `snake_case` | `{ wallet_id, category_id, icon_id }` |
| JWT payload keys | `camelCase` | `{ userId, email }` |
| `req.user` properties | `camelCase` | `req.user.userId`, `req.user.email` |
| Enum values for `type` | lowercase strings | `'income'`, `'expense'` |

### 5.2 Controller Structure

Every controller method follows this exact structure:

```js
async methodName(req, res) {
  try {
    // 1. Extract userId from req.user (for protected routes)
    const userId = req.user.userId;

    // 2. Extract fields from req.body / req.params / req.query
    const { field1, field2 } = req.body;

    // 3. HTTP-level validation (required fields, simple format checks)
    if (!field1) return ApiResponse.badRequest(res, 'Error message in Vietnamese');

    // 4. Call service
    const result = await someService.doSomething(userId, { field1, field2 });

    // 5. Return success response
    return ApiResponse.success(res, result, 'Success message in Vietnamese');
  } catch (error) {
    // 6. Map known error messages to specific status codes using ERROR_MESSAGES
    if (error.message === ERROR_MESSAGES.RESOURCE_NOT_FOUND) return ApiResponse.notFound(res, error.message);
    if (error.message === ERROR_MESSAGES.RESOURCE_ACCESS_DENIED) return ApiResponse.forbidden(res, error.message);

    // 7. Log unexpected errors and return generic 500
    logger.error('Method name error:', error);
    return ApiResponse.error(res, error.message);
  },
},
```

### 5.3 Service Structure

```js
/**
 * JSDoc contract block describing params, returns, and throws.
 * @param {string} userId
 * @param {Object} data
 * @returns {Promise<Object>}
 * @throws {Error} ERROR_MESSAGES.RESOURCE_NOT_FOUND
 */
async methodName(userId, data) {
  // 1. Validate business rules (type validity, etc.)
  if (!['income', 'expense'].includes(data.type))
    throw new Error(ERROR_MESSAGES.INVALID_TYPE);

  // 2. Fetch from repository
  const resource = await someRepository.findById(data.id);

  // 3. Check existence
  if (!resource) throw new Error(ERROR_MESSAGES.RESOURCE_NOT_FOUND);

  // 4. Check ownership
  if (resource.user_id !== userId) throw new Error(ERROR_MESSAGES.RESOURCE_ACCESS_DENIED);

  // 5. Convert BigInt before create/update
  const result = await someRepository.create({ ...data, amount: BigInt(data.amount) });

  // 6. Convert BigInt back to string before returning
  return { ...result, amount: result.amount.toString() };
},
```

### 5.4 Repository Structure

```js
const someRepository = {
  async findById(id) {
    return await prisma.someModel.findUnique({ where: { id } });
  },
  async create(data) {
    return await prisma.someModel.create({ data });
  },
  async update(id, data) {
    return await prisma.someModel.update({
      where: { id },
      data: { ...data, updated_at: new Date() },  // Always update updated_at
    });
  },
  async delete(id) {
    return await prisma.someModel.delete({ where: { id } });
  },
};
export default someRepository;
```

### 5.5 BigInt Handling Rules

- **Prisma models with `BigInt` fields:** `Wallet.initial_balance`, `Transaction.amount`, `Budget.target_amount`.
- **Inbound:** Convert client-sent numbers to `BigInt` in the **service layer**: `BigInt(amount)`.
- **Outbound:** Convert BigInt to `String` in the **service layer** before returning: `amount.toString()`.
- **Express bigint serializer** is registered in `app.js` as a safety net: `app.set("json replacer", ...)`.
- Never let a `BigInt` reach `JSON.stringify` without prior conversion; the replacer is just a fallback.

### 5.6 Partial Updates

Use the "build an `updateData` object" pattern — only include fields that are actually provided:

```js
const updateData = {};
if (data.name !== undefined) updateData.name = data.name;
if (data.amount !== undefined) updateData.amount = BigInt(data.amount);
// ...
const updated = await repository.update(id, updateData);
```

### 5.7 Soft Delete vs Hard Delete

- **Wallets** use **soft delete** (`is_active: false`). All queries that list wallets filter by `is_active: true`.
- **Transactions**, **Categories**, and **Budgets** use **hard delete** (`prisma.model.delete()`).

---

## 6. Error Handling & Logging

### 6.1 Error Communication Across Layers

Services **throw plain `Error` objects** using centralized `ERROR_MESSAGES` constants. They never use `ApiResponse` — that is exclusively a Controller concern.

```js
// ✅ In a Service — throw with ERROR_MESSAGES constant
throw new Error(ERROR_MESSAGES.WALLET_NOT_FOUND);
throw new Error(ERROR_MESSAGES.TRANSACTION_ACCESS_DENIED);
throw new Error(ERROR_MESSAGES.INVALID_TRANSACTION_TYPE);
```

Controllers catch these errors and match against `ERROR_MESSAGES` constants:

```js
// ✅ In a Controller — map error messages to HTTP responses using ERROR_MESSAGES
if (error.message === ERROR_MESSAGES.TRANSACTION_NOT_FOUND) return ApiResponse.notFound(res, error.message);
if (error.message === ERROR_MESSAGES.TRANSACTION_ACCESS_DENIED) return ApiResponse.forbidden(res, error.message);
logger.error('Delete transaction error:', error);
return ApiResponse.error(res, error.message); // fallback 500
```

### 6.2 ApiResponse — The Standard Response Contract

**Always use `ApiResponse` (from `utils/responseUtils.js`). Never call `res.json()` or `res.status().json()` directly.**

| Method | HTTP Status | Use Case |
|---|---|---|
| `ApiResponse.success(res, data, message)` | 200 | Successful GET, PUT, DELETE |
| `ApiResponse.created(res, data, message)` | 201 | POST that creates a resource |
| `ApiResponse.badRequest(res, message, errors?)` | 400 | Validation failure, invalid input |
| `ApiResponse.unauthorized(res, message)` | 401 | Missing/expired/invalid token |
| `ApiResponse.forbidden(res, message)` | 403 | Ownership check failed |
| `ApiResponse.notFound(res, message)` | 404 | Resource does not exist |
| `ApiResponse.conflict(res, message)` | 409 | Email / unique field already exists |
| `ApiResponse.noContent(res, message)` | 204 | (Available but rarely used) |
| `ApiResponse.paginated(res, data, pagination, message)` | 200 | List with pagination metadata |
| `ApiResponse.error(res, message, statusCode?, errors?)` | 500 | Unexpected server error |

**Response shape — Success:**
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**Response shape — Error:**
```json
{
  "success": false,
  "message": "...",
  "errors": [ ... ]   // optional, present on badRequest with errors param
}
```

**Response shape — Paginated:**
```json
{
  "success": true,
  "message": "...",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 6.3 Logging Strategy

All logging is done through the `logger` singleton from `utils/logger.js`. No raw `console.log` or `console.error` calls exist in the codebase.

| Method | Use Case |
|---|---|
| `logger.info()` | Important events: server start, user creation, login success |
| `logger.debug()` | Detailed tracing: repository queries, token decode results (only fires when `NODE_ENV === 'development'`) |
| `logger.warn()` | Non-critical warnings: lenient Google auth mode |
| `logger.error()` | Unexpected errors caught in controller catch blocks |

**Logging rules:**
- Log method entry with relevant IDs, not sensitive data.
- **Never log**: raw passwords, JWT token values.
- Log outcomes with IDs only.
- `morgan('common')` logs every HTTP request at the Express level automatically.
- `requestLogger.js` middleware provides deeper per-request body/query logging and **redacts** the `authorization` header.

---

## 7. Authentication Flow

### 7.1 Email/Password Login

```
Client → POST /api/v1/auth/login { email, password }
       → authController.login
       → authService.login (look up user by email, verify bcrypt hash)
       → Returns { user, token }
Client stores token and sends: Authorization: Bearer <token>
```

### 7.2 Google Login (Android ID Token)

```
Client → POST /api/v1/auth/google { id_token, email, full_name }
       → authController.loginWithGoogle
       → authService.loginWithGoogle
         → googleAuthUtils.verifyGoogleTokenLenient(idToken, email)
           [tries strict verification first, falls back to lenient decode in dev]
         → upsert user (create if new, update avatar/name if existing)
         → jwtUtils.generateToken({ userId, email })
       → Returns { user, token }
```

### 7.3 JWT Middleware

`authenticateToken` middleware:
1. Reads `Authorization: Bearer <token>` header.
2. Returns `401` if missing or malformed.
3. Calls `jwtUtils.verifyToken(token)`.
4. On success, attaches `req.user = { userId: decoded.userId, email: decoded.email }`.
5. On failure (expired, invalid), returns `401`.

---

## 8. API Endpoint Reference

All endpoints are prefixed with `/api`. The versioned prefix is `/api/v1`.

### Health Check (`/api/v1/health`) — Public

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/health` | Public | Service health check with database connectivity status |

### Auth (`/api/v1/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Register with email + password |
| POST | `/api/v1/auth/login` | Public | Login with email + password |
| POST | `/api/v1/auth/google` | Public | Login/register with Google ID token |
| POST | `/api/v1/auth/logout` | 🔒 | Logout (stateless; client deletes token) |
| GET | `/api/v1/auth/profile` | 🔒 | Get current user profile |
| PUT | `/api/v1/auth/profile` | 🔒 | Update full_name / avatar_url |
| PUT | `/api/v1/auth/change-password` | 🔒 | Change password (requires oldPassword) |

### Wallets (`/api/v1/wallets`) — all 🔒

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/wallets` | Create wallet |
| GET | `/api/v1/wallets` | List user's wallets (with live balance) |
| GET | `/api/v1/wallets/:walletId` | Get wallet by ID (with live balance) |
| PUT | `/api/v1/wallets/:walletId` | Update wallet |
| DELETE | `/api/v1/wallets/:walletId` | Soft-delete wallet |

### Transactions (`/api/v1/transactions`) — all 🔒

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/transactions` | Create transaction |
| GET | `/api/v1/transactions` | Get all user's transactions (with filters) |
| GET | `/api/v1/transactions/:transactionId` | Get transaction by ID |
| PUT | `/api/v1/transactions/:transactionId` | Update transaction |
| DELETE | `/api/v1/transactions/:transactionId` | Delete transaction |
| GET | `/api/v1/transactions/wallet/:walletId` | Get transactions for a wallet (with filters) |
| GET | `/api/v1/transactions/wallet/:walletId/statistics` | Wallet statistics (income/expense totals) |

**Query filters** (all optional): `?type=income|expense`, `?category_id=`, `?wallet_id=`, `?start_date=`, `?end_date=`

### Categories (`/api/v1/categories`) — all 🔒

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/categories` | Create category |
| GET | `/api/v1/categories` | List user's categories (optional `?type=`) |
| GET | `/api/v1/categories/:categoryId` | Get category by ID |
| PUT | `/api/v1/categories/:categoryId` | Update category |
| DELETE | `/api/v1/categories/:categoryId` | Delete category |

### Budgets (`/api/v1/budgets`) — all 🔒

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/budgets` | Create budget |
| GET | `/api/v1/budgets` | List user's budgets (optional `?wallet_id=`, `?category_id=`) |
| GET | `/api/v1/budgets/:budgetId` | Get budget details (includes total_spent, remaining) |
| PUT | `/api/v1/budgets/:budgetId` | Update budget |
| DELETE | `/api/v1/budgets/:budgetId` | Delete budget |

---

## 9. Database Schema Quick Reference

```prisma
model User {
  id            String    @id @default(uuid()) // UUID v4
  full_name     String?   // NVarChar(255)
  email         String?   @unique
  avatar_url    String?   // NVarChar(Max)
  auth_provider String?   // 'local' | 'google'
  password      String?   // bcrypt hash; null for Google users
  created_at    DateTime? @default(now())
}

model Wallet {
  id              String   @id @default(uuid())
  user_id         String?
  name            String
  initial_balance BigInt?  @default(0)
  currency        String?  @default("VND")
  icon_id         String?
  created_at      DateTime
  updated_at      DateTime
  is_active       Boolean? @default(true)  // soft-delete flag
}

model Category {
  id        String  @id @default(uuid())
  user_id   String?
  name      String
  type      String  // 'income' | 'expense'
  icon_name String?
}

model Transaction {
  id               String    @id @default(uuid())
  wallet_id        String
  category_id      String?
  amount           BigInt
  type             String    // 'income' | 'expense'
  transaction_date DateTime?
  icon_id          String?
  note             String?
  created_at       DateTime  @default(now())
  updated_at       DateTime  @default(now())
  // Indexes: wallet_id, category_id, transaction_date
}

model Budget {
  id            String    @id @default(uuid())
  wallet_id     String
  category_id   String
  target_amount BigInt
  start_date    DateTime? @db.Date
  end_date      DateTime? @db.Date
}
```

**Key schema facts:**
- No foreign key relations are declared in Prisma (`@@map` only) — ownership is enforced in application code.
- `Transaction.amount`, `Wallet.initial_balance`, and `Budget.target_amount` are stored as SQL Server `bigint`.
- Prisma UUIDs: `@default(uuid())` — strings of length 36.
- All date fields accept `DateTime` (ISO 8601 strings from client are converted with `new Date(value)` in service layer).

---

## 10. Environment Variables

| Variable | Required | Example / Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | `sqlserver://host;database=...` | Prisma connection string |
| `JWT_SECRET` | ✅ | `your-secret-key` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | ❌ | `7d` | Token lifetime |
| `PORT` | ❌ | `3000` | Server port |
| `GOOGLE_CLIENT_ID` | ✅ (for Google login) | `....apps.googleusercontent.com` | Web OAuth2 Client ID |
| `FRONTEND_URL` | ❌ | `http://localhost:5173` | Allowed CORS origin |
| `BASE_URL` | ❌ | `/api` | Router mount path |
| `NODE_ENV` | ❌ | `development` | Controls debug logging and lenient Google auth |
| `GOOGLE_AUTH_LENIENT` | ❌ | `true` | Enables dev-only insecure Google token decode |

---

## 11. Known Bugs & Technical Debt — Resolution Status

> All issues from the initial audit have been resolved as of 2026-04-17.

1. ✅ **RESOLVED** — **Missing `authMiddleware.js`**: Fixed — all route files now correctly import `{ authenticateToken }` from `'../middleware/authenticateToken.js'`.

2. ✅ **RESOLVED** — **`ApiResponse.conflict()` is undefined**: Fixed — `static conflict(res, message)` added to `responseUtils.js`, returns HTTP 409.

3. ✅ **RESOLVED** — **Duplicate password utilities**: `utils/hashPassword.js` deleted. Only `passwordUtils.js` remains.

4. ✅ **RESOLVED** — **`authService.js` broken `login` method**: Rewritten as a proper service method accepting `{ email, password }` and returning `{ user, token }`.

5. ✅ **RESOLVED** — **No versioning prefix**: Routes now use `/api/v1/` prefix via v1 sub-router in `routes/index.js`.

6. ✅ **RESOLVED** — **CORS disabled**: `app.use(cors(corsOptions))` re-enabled with `FRONTEND_URL` env var configuration.

7. ✅ **RESOLVED** — **`Budget` model has no API**: Full CRUD implemented with repository, service, controller, and routes.

8. ✅ **RESOLVED** — **Missing `#repositories/*` alias**: Added to `package.json` imports.

9. ✅ **RESOLVED** — **Raw `console.log`/`console.error` everywhere**: All replaced with `logger.info/debug/error` from `utils/logger.js`.

10. ✅ **RESOLVED** — **Hardcoded error strings**: Centralized in `utils/errorMessages.js` as `ERROR_MESSAGES` constants.

11. ✅ **RESOLVED** — **Missing JSDoc contracts**: All service methods now have `@param`, `@returns`, `@throws` documentation.

12. ✅ **RESOLVED** — **No health check endpoint**: `GET /api/v1/health` added with database connectivity check.

---

## 12. AI Coding Instructions

When generating or modifying code for this project, follow these rules **without exception**:

### Module & Import Rules
- **Always use ES Module syntax** (`import`/`export`). Never use `require()` or `module.exports`.
- **Always include `.js` extensions** in relative import paths: `import x from './utils/responseUtils.js'`.
- **Use `#alias/*` imports** when referencing cross-layer resources (e.g., `import ApiResponse from '#utils/responseUtils.js'`), unless the import is already using relative paths consistently in the file you're editing.
- **Never skip a layer**: Controllers never import repositories; services never import `ApiResponse`.

### Response Rules
- **Always use `ApiResponse` static methods** to send HTTP responses. Never call `res.json()` directly.
- Return statements must include the `return` keyword before `ApiResponse.*` calls to prevent code from running after a response is sent.
- Always provide Vietnamese-language messages in `ApiResponse` calls to match the existing UX.

### Error Handling Rules
- In **services**: throw `new Error(ERROR_MESSAGES.SOME_KEY)`.
- In **controllers**: catch those errors, check `error.message === ERROR_MESSAGES.SOME_KEY`, and map to the appropriate `ApiResponse.*` method.
- Always include a fallback: `logger.error('Context error:', error); return ApiResponse.error(res, error.message);` at the end of every catch block.

### BigInt Rules
- **Inbound** (body → service): convert with `BigInt(value)` in the service layer.
- **Outbound** (service → controller): convert with `.toString()` before returning from the service.
- Do not rely on the JSON replacer in `app.js` as a primary strategy.

### Controller Method Rules
- Always extract `const userId = req.user.userId;` from the authenticated request first.
- Perform HTTP-level validation (missing required fields, format) in the controller before calling the service.
- Perform business-logic validation (ownership, type enums) in the service.

### Service Method Rules
- Always add a JSDoc contract block (`@param`, `@returns`, `@throws`).
- Always check resource existence before ownership: `if (!resource) throw new Error(...)`, then `if (resource.user_id !== userId) throw new Error(...)`.
- Build a partial `updateData` object for PATCH-style updates — only include defined fields.
- When creating a new resource with `user_id`, always pass the `userId` parameter from the service signature, not from the request.

### Repository Rules
- The only place that may import and call `prisma` is a repository file.
- Always pass `updated_at: new Date()` in `update()` operations.
- For wallets: use `softDelete()` (set `is_active: false`), not `.delete()`.
- For transactions/categories/budgets: use hard delete (`.delete()`).

### Logging Rules
- Use `logger` from `utils/logger.js` exclusively. Never use `console.log` or `console.error`.
- Never log raw passwords or JWT token values.

### Object-Literal Naming Rules
- Controller object: `camelCase` (`const walletController = { ... }`), exported as `export default walletController`.
- Service object: `camelCase` (`export const walletService = { ... }; export default walletService`).
- Repository object: `camelCase` (`const walletRepository = { ... }`), exported as `export default walletRepository`.

### New Feature Checklist

When adding a **new resource**:
1. ✅ Create `repositories/<resource>Repository.js` (PrismaClient calls only)
2. ✅ Create `services/<resource>Service.js` (business logic, ownership checks, BigInt conversions, JSDoc contracts, ERROR_MESSAGES)
3. ✅ Create `controllers/<resource>Controller.js` (HTTP layer, ApiResponse calls, ERROR_MESSAGES mapping)
4. ✅ Create `routes/<resource>Routes.js` (mount authenticateToken via `router.use()`)
5. ✅ Register in `routes/index.js` v1Router: `v1Router.use('/<resources>', <resource>Routes)`
6. ✅ Add ERROR_MESSAGES constants to `utils/errorMessages.js`
7. ✅ If new Prisma model is needed: update `schema.prisma`, run `npx prisma db push` and `npx prisma generate`

---

## 13. Changelog

### 2026-04-17 — Major Refactoring (SOA-Compliant, Bug-Free, Production-Ready)

**Bug Fixes:**
- **BUG-01**: Fixed middleware import in `walletRoutes.js`, `transactionRoutes.js`, `categoryRoutes.js` — changed from non-existent `authMiddleware.js` to correct `authenticateToken.js`
- **BUG-02**: Added `ApiResponse.conflict()` static method to `responseUtils.js` — returns HTTP 409
- **BUG-03**: Rewrote `authService.login()` — removed copy-pasted controller code that caused infinite recursion; now a proper service method accepting `{ email, password }` and returning `{ user, token }`

**Technical Debt Resolution:**
- **DEBT-01**: Deleted dead code file `utils/hashPassword.js` (was unused duplicate of `passwordUtils.js`)
- **DEBT-02**: Added API versioning — all routes now served under `/api/v1/` via v1 sub-router
- **DEBT-03**: Re-enabled CORS in `app.js` with configuration from `FRONTEND_URL` env var
- **DEBT-04**: Replaced all `console.log`/`console.error` with `logger.info`/`logger.debug`/`logger.error` across entire codebase
- **DEBT-05**: Added `#repositories/*` path alias to `package.json` imports

**SOA & RESTful Compliance:**
- **SOA-01**: Added JSDoc contract blocks (`@param`, `@returns`, `@throws`) to every method in all service files
- **SOA-02**: Implemented complete Budget service boundary — `budgetRepository.js`, `budgetService.js`, `budgetController.js`, `budgetRoutes.js`
- **SOA-03**: Audited and standardized HTTP status codes (201 for POST, 409 for conflicts, 403 for ownership, 404 for not found)
- **SOA-04**: Created `utils/errorMessages.js` with centralized `ERROR_MESSAGES` constants; all services and controllers now use these constants instead of hardcoded strings
- **SOA-05**: Added `GET /api/v1/health` endpoint with database connectivity check

**Code Quality:**
- Standardized all object export naming to `camelCase` (controllers, services, repositories)
- Ensured layer isolation: no controller imports repositories, no service uses `ApiResponse` or `res`
