# QLCT Server — Project Master Guide

> **Purpose of this document:** This is the single source of truth for any AI assistant helping with this codebase. Read this entire document before writing a single line of code. Every architectural choice, naming rule, and coding convention below is extracted directly from the existing source — follow them strictly and never deviate unless explicitly asked by the user.

---

## 1. Project Overview & Purpose

**QLCT Server** (Quản Lý Chi Tiêu — Vietnamese for "Expense Management") is a RESTful JSON API backend for a personal finance mobile/web application. It allows authenticated users to:

- **Manage Wallets** — Create multiple wallets (e.g., Cash, Bank Account) with an initial balance and a computed real-time current balance.
- **Record Transactions** — Log income and expense transactions against a wallet, with optional category and date filters.
- **Organize Categories** — Create custom income/expense categories with icons.
- **Set Budgets** — Define budget targets per wallet+category+date-range and track how much has been spent vs. the target.
- **Authenticate** — Register/login with email+password (local) or Google OAuth (ID token via `google-auth-library`). A single JWT (`Bearer` token) is used for all subsequent protected requests.

**Core business rules encoded in the codebase:**
- Every resource (wallet, transaction, category, budget) is **owned by a user**. Ownership is verified in the Service layer on every read/write/delete.
- `amount`, `initial_balance`, and `target_amount` are stored as **SQL Server `BigInt`** (to handle large Vietnamese Dong amounts without floating-point errors). They are serialized to `String` before being sent to the client via a global `json replacer` and explicit `.toString()` calls in services.
- `type` fields for `Category` are enforced enums: **`'income'`** or **`'expense'`** only. `Category` is the **Single Source of Truth** for transaction type and icon — `Transaction` does NOT store `type` or `icon_id` directly.
- Wallets use **soft-delete** (`deleted_at = timestamp`); Categories use **soft-delete** (`is_active = false` + `deleted_at = timestamp`, for sync support). Transactions and Budgets use **hard-delete**.

---

## 2. Tech Stack & Key Libraries

| Technology | Version | Role |
|---|---|---|
| **Node.js** | Current LTS | Runtime |
| **Express** | `^5.x` | HTTP framework (note: v5, not v4) |
| **Prisma ORM** | `^5.x` | Database client & schema management |
| **SQL Server** | — | Database (via `@prisma/client` with `sqlserver` provider) |
| **jsonwebtoken** | `^9.x` | JWT generation and verification |
| **bcrypt** | `^6.x` | Password hashing (10 salt rounds) |
| **google-auth-library** | `^10.x` | Verifying Google ID tokens (OAuth login) |
| **Zod** | `^3.x` | Schema-based input validation in validator middleware |
| **Helmet** | `^8.x` | Security headers (`no-referrer` referrer policy) |
| **CORS** | `^2.x` | Cross-origin requests, `credentials: true`, origin from `FRONTEND_URL` env |
| **Morgan** | `^1.x` | HTTP request logging (`'common'` format) |
| **cookie-parser** | `^1.x` | Cookie parsing middleware |
| **dotenv** | `^17.x` | Environment variable loading |
| **nodemon** | `^3.x` (dev) | Hot-reload during development |

**Module System:** ES Modules (`"type": "module"` in `package.json`). All imports use ESM `import/export` syntax. **No CommonJS `require()`.**

**Path Aliases:** Defined in `package.json` under `"imports"` for Node's subpath imports:
```
#controllers/* → ./controllers/*
#services/*    → ./services/*
#repositories/* → ./repositories/*
#routes/*      → ./routes/*
#middleware/*  → ./middleware/*
#utils/*       → ./utils/*
#lib/*         → ./lib/*
```
These are used **in `app.js`** (`import Route from '#routes/index.js'`). Inside the layer directories themselves, **relative imports are used** (e.g., `'../utils/responseUtils.js'`).

---

## 3. Project Structure

```
QLCT_Server/
├── server.js              # Entry point — starts HTTP server, calls app.listen()
├── app.js                 # Express app factory — registers all global middleware & mounts routes
├── package.json           # Dependencies, scripts, and Node path aliases (#imports)
├── .env                   # Environment variables (never commit)
│
├── config/
│   └── database.js        # Prisma client singleton; tests connection on startup
│
├── prisma/
│   └── schema.prisma      # Database schema (source of truth for all models)
│
├── routes/
│   ├── index.js           # Root router: health check + mounts /v1 sub-router
│   ├── authRoutes.js      # /v1/auth — public + protected auth endpoints
│   ├── walletRoutes.js    # /v1/wallets — all protected; also mounts nested /transactions
│   ├── transactionRoutes.js # /v1/transactions — flat user-wide CRUD
│   ├── categoryRoutes.js  # /v1/categories — all protected
│   └── budgetRoutes.js    # /v1/budgets — all protected
│
├── controllers/
│   ├── authController.js
│   ├── walletController.js
│   ├── transactionController.js   # also handles /wallets/:walletId/transactions handlers
│   ├── categoryController.js
│   └── budgetController.js
│
├── services/
│   ├── authService.js
│   ├── walletService.js
│   ├── transactionService.js
│   ├── categoryService.js
│   └── budgetService.js
│
├── repositories/
│   ├── userRepository.js
│   ├── walletRepository.js
│   ├── transactionRepository.js
│   ├── categoryRepository.js
│   ├── budgetRepository.js
│   └── healthRepository.js        # DB health check for the /health endpoint
│
├── middleware/
│   ├── authenticateToken.js       # JWT verification → populates req.user
│   ├── validateRequest.js         # express-validator error formatter (legacy, not primary)
│   ├── requestLogger.js           # Custom request logger middleware
│   └── validators/                # Zod schema validators (one file per domain)
│       ├── authValidators.js
│       ├── walletValidators.js
│       ├── transactionValidators.js
│       ├── categoryValidators.js
│       └── budgetValidators.js
│
└── utils/
    ├── responseUtils.js   # ApiResponse class — all HTTP responses go through this
    ├── errorMessages.js   # ERROR_MESSAGES constant object (centralized strings)
    ├── logger.js          # Logger class singleton (info/error/warn/debug)
    ├── jwtUtils.js        # JwtUtils class singleton (generateToken/verifyToken)
    ├── passwordUtils.js   # passwordUtils object (hashPassword/comparePassword)
    └── googleAuthUtils.js # Google token verification utilities
```

---

## 4. Architecture & Design Patterns

### Pattern: 4-Layer Service-Oriented Architecture (SOA)

The codebase enforces a strict **4-layer architecture**. Data flows in one direction only:

```
HTTP Request
     ↓
[Validator Middleware]  — Zod schema validation; sets req.body = result.data on success
     ↓
[Route]          — Declares HTTP method, path, and middleware chain
     ↓
[Controller]     — Validates HTTP input, calls Service, maps result to ApiResponse
     ↓
[Service]        — Contains ALL business logic and authorization checks
     ↓
[Repository]     — Contains ALL database queries (Prisma calls only)
     ↓
Prisma / SQL Server DB
```

### Layer Responsibilities (Strict Rules)

| Layer | Does | Never Does |
|---|---|---|
| **Validator Middleware** | Zod schema parse; `req.body = result.data`; returns `ApiResponse.badRequest` on failure | Contains business rules |
| **Route** | Declares path + method + middleware order | Contains any logic |
| **Controller** | Extracts `req.user.userId`, calls one service method, returns `ApiResponse.*()` | Never touches Prisma directly, never throws domain errors |
| **Service** | Checks ownership, validates business rules, calls repository methods | Never accesses `req`/`res`, never builds HTTP responses |
| **Repository** | Executes Prisma queries, builds `where` clauses | Contains no business logic or authorization checks |

### Cross-Layer Communication

- **Controller → Service:** Call via the exported service object. The `userId` is always extracted from `req.user.userId` in the controller.
- **Service → Repository:** Call via the default-exported repository object.
- **Service → Service:** **FORBIDDEN** — Services may import and call a **repository** from another domain when they need cross-domain data (e.g., `transactionService` uses `walletRepository` for ownership checks). They MUST NOT import other services.
- **Error propagation:** Services `throw new Error(ERROR_MESSAGES.SOME_KEY)`. Controllers `catch` it, compare `error.message` against `ERROR_MESSAGES` constants, and call the appropriate `ApiResponse` method.

### Input Validation Pattern

Every POST/PATCH/PUT route applies a **Zod validator middleware** before the controller:

```js
// In a route file:
router.post('/', validateCreateWallet, walletController.createWallet);

// In middleware/validators/walletValidators.js:
const createWalletSchema = z.object({ name: z.string().min(1), ... });
export const validateCreateWallet = (req, res, next) => {
  const result = createWalletSchema.safeParse(req.body);
  if (!result.success) {
    return ApiResponse.badRequest(res, 'Dữ liệu không hợp lệ', errors);
  }
  req.body = result.data; // Replace raw body with coerced, typed, defaulted data
  next();
};
```

The controller then receives **clean, validated data** — no `if (!name)` checks needed.

### Authentication Flow

```
Request → authenticateToken middleware → reads Authorization: Bearer <token>
                                       → jwtUtils.verifyToken(token)
                                       → populates req.user = { userId, email }
                                       → next()
```

Protected routes either apply `authenticateToken` per-route (auth routes) or **once for the entire router** via `router.use(authenticateToken)` (wallets, transactions, categories, budgets).

### API URL Structure

```
Base URL: /api  (from BASE_URL env var)
Version:  /api/v1
Health:   GET /api/health  (public, no auth)

Auth Endpoints:
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login
  POST   /api/v1/auth/google
  POST   /api/v1/auth/logout            (protected)
  GET    /api/v1/auth/profile            (protected)
  PATCH  /api/v1/auth/profile            (protected) ← was PUT
  PATCH  /api/v1/auth/change-password    (protected) ← was PUT

Wallet Endpoints:
  POST   /api/v1/wallets/
  GET    /api/v1/wallets/
  GET    /api/v1/wallets/:walletId
  PATCH  /api/v1/wallets/:walletId       ← was PUT
  DELETE /api/v1/wallets/:walletId       → 204 No Content

Nested Transaction Endpoints (under Wallet):
  POST   /api/v1/wallets/:walletId/transactions
  GET    /api/v1/wallets/:walletId/transactions
  GET    /api/v1/wallets/:walletId/transactions/statistics
  ← moved from /api/v1/transactions/wallet/:walletId

Transaction Endpoints (flat, user-wide):
  POST   /api/v1/transactions/
  GET    /api/v1/transactions/
  GET    /api/v1/transactions/:transactionId
  PATCH  /api/v1/transactions/:transactionId  ← was PUT
  DELETE /api/v1/transactions/:transactionId  → 204 No Content

Category Endpoints:
  POST   /api/v1/categories/
  GET    /api/v1/categories/
  GET    /api/v1/categories/:categoryId
  PATCH  /api/v1/categories/:categoryId       ← was PUT
  DELETE /api/v1/categories/:categoryId       → 204 No Content

Budget Endpoints:
  POST   /api/v1/budgets/
  GET    /api/v1/budgets/
  GET    /api/v1/budgets/:budgetId
  PATCH  /api/v1/budgets/:budgetId            ← was PUT
  DELETE /api/v1/budgets/:budgetId            → 204 No Content

Sync Endpoints (Offline-first Support):
  GET    /api/v1/sync/pull?last_sync_time=    (protected)
  POST   /api/v1/sync/push                    (protected)
```

---

## 5. Coding Conventions & Style Guide

### Module & Export Style

| Structure | Used For | Example |
|---|---|---|
| `export const fooService = { ... }` (named export of object literal) | Services | `authService`, `walletService` |
| `export default fooController` (default export of object literal) | Controllers | `authController`, `walletController` |
| `export default fooRepository` (default export of object literal) | Repositories | `walletRepository`, `transactionRepository` |
| `export default class ApiResponse { static ... }` | Utility class with static methods | `responseUtils.js` |
| `export default new FooClass()` | Utility singletons | `jwtUtils.js` (exports instance) |
| `export const logger = new Logger()` | Named singleton | `logger.js` |
| `export const ERROR_MESSAGES = { ... }` | Named constants | `errorMessages.js` |

> ⚠️ Repository object literals MUST use **camelCase** for their export variable names (`walletRepository`, NOT `WalletRepository`). They are plain objects, not classes.

### Naming Conventions

| What | Convention | Example |
|---|---|---|
| Files | `camelCase.js` | `walletService.js`, `authController.js` |
| Object/Class names | `PascalCase` for classes, `camelCase` for object literals | `class ApiResponse`, `const walletController = {}` |
| Function/method names | `camelCase`, verb-first | `createWallet`, `getWalletById`, `deleteTransaction` |
| URL params | `camelCase` (Express `:paramName`) | `:walletId`, `:transactionId`, `:categoryId`, `:budgetId` |
| DB fields (Prisma schema) | `snake_case` | `user_id`, `wallet_id`, `initial_balance`, `created_at` |
| Variables | `camelCase` | `userId`, `walletData`, `newWallet` |
| Constants | `UPPER_SNAKE_CASE` | `ERROR_MESSAGES`, `JWT_SECRET`, `SALT_ROUNDS` |
| Query filters | Inline object built with `if` guards | `if (type) filters.type = type;` |

### Function Structure Pattern (Controller method)

Every controller method follows this **exact** boilerplate:

```js
async methodName(req, res) {
  try {
    const userId = req.user.userId;              // 1. Extract userId from JWT
    const { field1, field2 } = req.body;         // 2. Destructure clean validated data

    const result = await someService.doWork(userId, { field1, field2 }); // 3. Call service
    return ApiResponse.success(res, result, 'Vietnamese success message'); // 4. Return response
  } catch (error) {
    if (error.message === ERROR_MESSAGES.SOME_ERROR) { // 5. Map known errors
      return ApiResponse.notFound(res, error.message);
    }
    logger.error('Context error:', error);        // 6. Log unknown errors
    return ApiResponse.error(res, error.message); // 7. Generic 500 fallback
  }
},
```

> No inline `if (!field)` required-field checks in controllers — Zod validators handle these upstream.

### Function Structure Pattern (Service method)

```js
/**
 * JSDoc with @param, @returns, and @throws for all possible errors.
 */
async methodName(resourceId, userId, data) {
  logger.info('ServiceName.methodName for context:', contextValue); // 1. Log entry

  const resource = await repository.findById(resourceId);           // 2. Fetch resource

  if (!resource) {                                                   // 3. Existence check
    throw new Error(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
  }

  if (resource.owner_id !== userId) {                               // 4. Ownership check
    throw new Error(ERROR_MESSAGES.RESOURCE_ACCESS_DENIED);
  }

  // 5. Partial update pattern
  const updateData = {};
  if (data.field !== undefined) updateData.field = data.field;

  const updated = await repository.update(resourceId, updateData);  // 6. DB operation

  return { ...updated, amount: updated.amount.toString() };         // 7. Serialize BigInt
},
```

### BigInt Serialization — Critical Rule

- **Input (Controller → Service):** Raw number from `req.body` (a JS `number`, coerced by Zod validator).
- **Service conversion:** Always wrap with `BigInt()` before passing to the repository: `BigInt(amount)`, `BigInt(initial_balance)`, `BigInt(target_amount)`.
- **Output (Service → Controller):** Always call `.toString()` on BigInt fields before returning: `amount: result.amount.toString()`.
- **Global safety net:** `app.js` has a global JSON replacer: `(key, value) => typeof value === 'bigint' ? value.toString() : value`. This is a fallback, not a replacement for explicit `.toString()` in services.

### Update Pattern (Partial Updates)

Never spread `data` directly into `updateData`. Always build it conditionally:

```js
const updateData = {};
if (data.name) updateData.name = data.name;
if (data.initial_balance !== undefined) updateData.initial_balance = BigInt(data.initial_balance);
if (data.icon_id !== undefined) updateData.icon_id = data.icon_id;
```

Use `!== undefined` for fields that can legitimately be set to `null` or `0`.

---

## 6. Error Handling & Logging

### Error Message Contract

All domain error messages live in **`utils/errorMessages.js`** as `ERROR_MESSAGES.KEY`. This is the **contract** between Service and Controller layers.

- **Services** `throw new Error(ERROR_MESSAGES.KEY)` for domain errors.
- **Controllers** `catch` and compare `error.message === ERROR_MESSAGES.KEY` to determine the HTTP status code.
- **Never** hard-code error strings in controllers or services. Always reference `ERROR_MESSAGES`.

### HTTP Status Mapping (via `ApiResponse`)

| `ApiResponse` Method | HTTP Status | When to Use |
|---|---|---|
| `ApiResponse.success(res, data, message)` | 200 | Successful GET, PATCH |
| `ApiResponse.created(res, data, message)` | 201 | Successful POST (resource created) |
| `ApiResponse.noContent(res)` | 204 | Successful DELETE (no body) |
| `ApiResponse.badRequest(res, message, errors?)` | 400 | Invalid input format/value |
| `ApiResponse.unauthorized(res, message)` | 401 | Missing/invalid token |
| `ApiResponse.forbidden(res, message)` | 403 | Token valid, but user doesn't own resource |
| `ApiResponse.notFound(res, message)` | 404 | Resource doesn't exist |
| `ApiResponse.conflict(res, message)` | 409 | Duplicate resource (e.g., email) |
| `ApiResponse.error(res, message, statusCode?)` | 500 | Unexpected/unhandled errors |
| `ApiResponse.paginated(res, data, pagination)` | 200 | Paginated list responses |

> **DELETE endpoints MUST return `ApiResponse.noContent(res)` (204), not `ApiResponse.success()` (200).**

### Standard Response Shape

**Success:**
```json
{
  "success": true,
  "message": "Tạo ví thành công",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Không tìm thấy ví",
  "errors": [ ... ]  // optional, only for validation errors
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    { "field": "name", "message": "Tên ví là bắt buộc" }
  ]
}
```

**Paginated:**
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

### Logger Usage

Use the `logger` singleton from `utils/logger.js`:

```js
import { logger } from '../utils/logger.js';

logger.info('Service.method context:', value);   // Normal operations
logger.debug('Extra detail:', value);            // Dev-only (skipped in production)
logger.warn('Something notable:', value);        // Warnings
logger.error('Error context:', error);           // Errors (always with error object)
```

**Logging rules extracted from codebase:**
- Log at **service entry** with `logger.info('ServiceName.methodName for context:', contextId)`.
- Log **debug** for intermediate results (e.g., DB lookup results).
- **Never log** sensitive values: passwords, tokens, or full user credentials.
- Log **unknown errors** in every controller `catch` block before returning `ApiResponse.error()`.
- `logger.debug()` calls are **no-ops in production** (`NODE_ENV !== 'development'`).

---

## 7. Database & Data Model

### Schema Summary

```
User           — id (UUID), email (unique), full_name, avatar_url, auth_provider, password, created_at, updated_at
Wallet         — id (UUID), user_id (FK→User), name, initial_balance (BigInt), currency, icon_id, created_at, updated_at, deleted_at
Category       — id (UUID), user_id (FK→User), name, type ('income'|'expense'), icon_name, is_active, created_at, updated_at, deleted_at
Transaction    — id (UUID), wallet_id (FK→Wallet), category_id (FK→Category, nullable), amount (BigInt), transaction_date, note, created_at, updated_at, deleted_at
Budget         — id (UUID), wallet_id (FK→Wallet), category_id (FK→Category), target_amount (BigInt), start_date, end_date, created_at, updated_at, deleted_at
```

**Key data facts:**
- All primary keys are UUID strings (`@default(uuid())`), `@db.VarChar(36)`.
- Text fields use `NVarChar` for names/notes (supports Vietnamese Unicode), `VarChar` for IDs/codes.
- `Transaction` has DB indexes on `wallet_id`, `category_id`, `transaction_date`, and `updated_at` (sync support).
- **`Category` is the Single Source of Truth** for transaction type (`'income'`/`'expense'`) and icon. `Transaction` does NOT store `type` or `icon_id` — derive via `transaction.category.type` and `transaction.category.icon_name`.
- `Wallet.current_balance` is **computed dynamically**: `initial_balance + SUM(income) - SUM(expense)`. Type is determined via `transaction.category.type` with `include: { category: true }` in `walletRepository.getWalletBalance()`.
- `Budget.total_spent` and `Budget.remaining` are **computed dynamically** in `budgetRepository.getTotalSpent()` using nested Prisma filter `category: { type: 'expense' }`.
- Default currency is `'VND'`.
- `auth_provider` values: `'local'` (email+password) or `'google'`.
- Prisma `@relation` directives are defined on all models to support `include` and nested filters.

### Soft-Delete Strategy

| Model | Soft-Delete Mechanism | Hard-Delete |
|---|---|---|
| **Wallet** | `deleted_at = timestamp` via `walletRepository.softDelete()` | Never |
| **Category** | `is_active = false` + `deleted_at = timestamp` via `categoryRepository.softDelete()` | Never |
| **Transaction** | `deleted_at` column reserved for future sync support | `transactionRepository.delete()` |
| **Budget** | `deleted_at` column reserved for future sync support | `budgetRepository.delete()` |

**`Category.is_active` vs `Category.deleted_at`:**
- `is_active = false` → **Hidden** from UI dropdowns. Transactions still counted in statistics.
- `deleted_at != null` → **Soft-deleted** for sync. Category fully hidden; existing transactions preserved.

### Ownership Chain

```
User
 └─ owns → Wallet (user_id)
            └─ owns → Transaction (wallet_id → wallet.user_id)
            └─ owns → Budget (wallet_id → wallet.user_id)
 └─ owns → Category (user_id)
```

Ownership for `Transaction` and `Budget` is validated **indirectly** by fetching the parent `Wallet` and checking `wallet.user_id === userId`.

### Special Repository Methods

| Method | Repository | Purpose |
|---|---|---|
| `findByIdWithPassword(id)` | `userRepository` | Fetches user WITH password hash — only for `changePassword`. Never expose to clients. |
| `getWalletBalance(walletId)` | `walletRepository` | Computes `current_balance` via `include: { category: true }` on transactions |
| `getTotalSpent(...)` | `budgetRepository` | Computes spent using nested filter `category: { type: 'expense' }` |
| `getStatistics(walletId, ...)` | `transactionRepository` | Aggregates income/expense stats via `include: { category: true }` |
| `checkConnection()` | `healthRepository` | Probes DB connection for the health endpoint |

---

## 8. AI Coding Instructions

These are strict rules an AI must follow when adding or modifying code in this project.

### ✅ Always Do

1. **Always use ESM syntax.** All imports must use `import ... from '...'` and all exports use `export default` or `export const`. Never use `require()` or `module.exports`.

2. **Always use relative imports within layers.** Use `'../utils/responseUtils.js'`, not `'#utils/responseUtils.js'` inside service/controller/repository files. The `#` aliases are only used in `app.js`.

3. **Always include `.js` extension** in all import paths (e.g., `'../services/walletService.js'`). This is required for Node.js ESM.

4. **Always extract `userId` from `req.user.userId`** (not `req.user.id`). The JWT payload maps to `{ userId, email }` and the middleware populates `req.user` with exactly those keys.

5. **Always throw `ERROR_MESSAGES` constants** from services, never raw strings. Add new keys to `utils/errorMessages.js` first.

6. **Always map `error.message` to `ERROR_MESSAGES` constants** in the controller `catch` block. Never use `error.statusCode` or a custom error class—the error contract is plain `Error` with a message string.

7. **Always serialize BigInt fields to String** before returning from a service method: `amount: result.amount.toString()`.

8. **Always convert incoming numeric values to `BigInt()`** in the service before passing to the repository: `BigInt(amount)`.

9. **Always follow the 4-layer flow:** Route → Controller → Service → Repository. Never skip a layer or merge logic across layers.

10. **Always perform ownership checks in the Service layer**, never in the Controller or Repository.

11. **Always use soft-delete for Wallets** (`walletRepository.softDelete(id)`) but **hard-delete for all other resources** (`.delete(id)`).

12. **Always add JSDoc comments** to every new service method with `@param`, `@returns`, and `@throws` tags documenting all possible `ERROR_MESSAGES` it can throw.

13. **Always add a `logger.info()` call** at the start of every new service method to trace execution.

14. **Always use the partial-update pattern** for update methods — build an `updateData = {}` object and only set fields that are defined/provided.

15. **Always use the existing `ApiResponse` static methods.** Never call `res.status().json()` directly in a controller.

16. **Set `updated_at: new Date()`** in repository `update()` calls for `Wallet`, `Transaction`, `Category`, `Budget`, and `User`. This is handled inside each repository's `update()` / `softDelete()` method automatically.

17. **Always use `router.use(authenticateToken)`** at the top of any new resource route file. Do not apply it per-route unless mixed public/protected routes exist (as in `authRoutes.js`).

18. **Always filter `findByUserId` via wallet ownership** for cross-resource queries (e.g., getting all transactions across all of a user's wallets requires first fetching wallet IDs for that user). Use `deleted_at: null` when filtering wallets, not `is_active`.

19. **Always create a Zod validator file** in `middleware/validators/` for every new resource domain, and wire it to POST/PATCH routes before the controller handler.

20. **Always use `ApiResponse.noContent(res)` (204)** for DELETE endpoints. Never return 200 with a success message on DELETE.

21. **Always use `PATCH` for partial update routes**, not `PUT`. `PUT` is reserved for full resource replacement.

22. **Always use `healthRepository.checkConnection()`** for the health check — never import Prisma directly in `routes/index.js`.

23. **Always use `include: { category: true }`** when fetching transactions that need type/icon information (balance calculation, statistics, API responses). The linked Category is the Single Source of Truth for `type` and `icon_name`.

24. **Always use Prisma nested filtering** to filter transactions by type: `where: { category: { type: 'expense' } }` — never use `where: { type: 'expense' }` directly on the transaction (field does not exist).

25. **Always use soft-delete for Wallets** (`walletRepository.softDelete(id)`) and **Categories** (`categoryRepository.softDelete(id)`). Use **hard-delete for Transactions and Budgets**.

### ❌ Never Do

1. **Never import Prisma directly in a Controller, Service, or Route file.** Only Repositories import `prisma` from `'../config/database.js'`.

2. **Never put business logic or ownership checks in a Repository.** Repositories contain only pure Prisma CRUD queries and computed aggregations.

3. **Never use `res.status(X).json(...)` directly** in a controller. Always use `ApiResponse.*()`.

4. **Never log passwords, tokens, or sensitive secrets.** Log IDs, email addresses, and operation names only.

5. **Never mutate `req.body` directly.** Always destructure into local variables (Zod validators already replace req.body with clean data).

6. **Never use CommonJS.** No `require()`, no `module.exports`.

7. **Never create a new entity without verifying its parent's ownership first** (e.g., before creating a Transaction, always verify the wallet belongs to the `userId`).

8. **Never return BigInt values directly** from a service — they will cause JSON serialization errors. Always `.toString()` them.

9. **Never hard-code error message strings** in controllers or services. All user-facing messages live in `ERROR_MESSAGES`.

10. **Never add Prisma `include` or `select` for relations** unless explicitly necessary — the current pattern is to return flat model objects.

11. **Never import one Service from another Service.** Cross-domain data needs are met by importing the other service's Repository directly.

12. **Never place validation logic (`if (!field)`, regex, enum checks) inside controllers.** All validation belongs in `middleware/validators/*.js` Zod schemas.

13. **Never export repository objects with PascalCase names.** Repository exports are always camelCase: `walletRepository`, `transactionRepository`, etc.

### Adding a New Feature (Checklist)

When adding a new resource (e.g., a "Tag" feature), follow this exact sequence:

- [ ] Add the model to `prisma/schema.prisma` and run `npm run prisma:push`
- [ ] Add error message keys to `utils/errorMessages.js`
- [ ] Create `repositories/tagRepository.js` (CRUD + any aggregation methods; export as `tagRepository`)
- [ ] Create `services/tagService.js` (business logic, ownership checks, JSDoc, logger calls)
- [ ] Create `controllers/tagController.js` (HTTP I/O, `ApiResponse` calls, error mapping)
- [ ] Create `middleware/validators/tagValidators.js` (Zod schemas for create/update)
- [ ] Create `routes/tagRoutes.js` (apply `router.use(authenticateToken)`, wire validators before controllers, use `PATCH` for updates, `DELETE` returns `noContent`)
- [ ] Register the new route in `routes/index.js` under `v1Router`
