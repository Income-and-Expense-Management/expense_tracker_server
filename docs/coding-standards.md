# Coding Standards — QLCT Server (ExpressJS + Prisma ORM)

> **Audience:** AI coding assistants and human developers.
> **Authority:** These rules define the technical implementation standards for this project. They complement `soa-guidelines.md` (business architecture) and `restful-api-standards.md` (API design). All three documents MUST be followed together.
> **Scope:** Every file added or modified in this repository MUST pass every rule in this document.

---

## 1. Layered Architecture

This project enforces a strict **4-layer execution chain**:

```
Route → Controller → Service → Repository → Prisma → Database
```

### Rule 1.1 — Routes MUST only declare endpoints and attach middleware. Nothing else.

A route file is a **wiring diagram**. It connects a URL + HTTP method to a middleware chain and a controller handler. It MUST contain zero business logic, zero validation logic, and zero Prisma calls.

```js
// ✅ GOOD — routes/walletRoutes.js
import express from 'express';
import walletController from '../controllers/walletController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { validateCreateWallet } from '../middleware/validators/walletValidators.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/',           validateCreateWallet, walletController.createWallet);
router.get('/',            walletController.getAllWallets);
router.get('/:walletId',   walletController.getWalletById);
router.put('/:walletId',   walletController.updateWallet);
router.delete('/:walletId',walletController.deleteWallet);

export default router;
```

```js
// ❌ BAD — business logic leaking into a route file
router.post('/', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' }); // ❌ validation in route
  const wallet = await prisma.wallet.create({ data: { name } });      // ❌ Prisma in route
  res.json(wallet);
});
```

---

### Rule 1.2 — Controllers MUST only handle HTTP context. All logic belongs in Services.

A controller method has exactly **four jobs**:
1. Extract parameters from `req` (`req.body`, `req.params`, `req.query`, `req.user`).
2. Call exactly one Service method.
3. Return the result via `ApiResponse`.
4. Catch errors and map them to the correct HTTP status via `ApiResponse`.

It MUST NOT contain `if/else` branches that implement business rules. It MUST NOT call Prisma. It MUST NOT call another controller.

```js
// ✅ GOOD — controllers/walletController.js
const walletController = {
  async createWallet(req, res, next) {
    try {
      const userId = req.user.userId;                   // Extract from JWT
      const { name, initial_balance, currency, icon_id } = req.body; // Extract from body

      const wallet = await walletService.createWallet(userId, {
        name, initial_balance, currency, icon_id,
      });

      return ApiResponse.created(res, wallet, 'Tạo ví thành công');
    } catch (error) {
      next(error); // ✅ Delegate to centralized error handler
    }
  },
};
```

```js
// ❌ BAD — business rules embedded in the controller
async createWallet(req, res) {
  const { name, initial_balance } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' }); // ❌ validation here
  if (initial_balance < 0) return res.status(400).json({ error: '...' }); // ❌ business rule here
  const result = await prisma.wallet.create({ data: { name } });          // ❌ Prisma here
  res.json(result);
}
```

---

### Rule 1.3 — Services MUST contain ALL business logic. No exceptions.

Services enforce business rules, check resource ownership, orchestrate multiple repository calls, and throw domain errors. They MUST NOT know about HTTP. They MUST NOT import or call `ApiResponse`. They MUST NOT accept `req` or `res` as parameters.

```js
// ✅ GOOD — services/walletService.js
async createWallet(userId, { name, initial_balance, currency, icon_id }) {
  logger.info('WalletService.createWallet for userId:', userId);

  // Business rule enforced here — not in the controller
  const userWallets = await walletRepository.findByUserId(userId);
  if (userWallets.length >= 10) {
    throw new AppError('Bạn chỉ được tạo tối đa 10 ví', 400, 'WALLET_LIMIT_EXCEEDED');
  }

  const newWallet = await walletRepository.create({
    user_id: userId,
    name,
    initial_balance: initial_balance ? BigInt(initial_balance) : BigInt(0),
    currency: currency || 'VND',
    icon_id,
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true,
  });

  return { ...newWallet, initial_balance: newWallet.initial_balance.toString() };
},
```

```js
// ❌ BAD — service calls ApiResponse (HTTP concern)
async createWallet(userId, data, res) { // ❌ res parameter
  const wallet = await walletRepository.create(data);
  return ApiResponse.created(res, wallet); // ❌ HTTP response inside service
}
```

---

### Rule 1.4 — Prisma MUST only be called inside Repository files.

`import prisma from '../config/database.js'` MUST appear **only in** `repositories/*.js` files. No other layer may import or use the Prisma client.

```js
// ✅ GOOD — repositories/walletRepository.js
import prisma from '../config/database.js'; // Only here

const walletRepository = {
  async create(data) {
    return await prisma.wallet.create({ data });
  },
  async findById(id) {
    return await prisma.wallet.findUnique({ where: { id } });
  },
};
export default walletRepository;
```

```js
// ❌ BAD — Prisma imported directly in a service
import prisma from '../config/database.js'; // ❌ Prisma in service layer

export const walletService = {
  async createWallet(userId, data) {
    return await prisma.wallet.create({ data }); // ❌
  },
};
```

---

## 2. Asynchronous Code

### Rule 3.1 — `async/await` MUST be used exclusively. `.then()/.catch()` chains are forbidden.

The entire codebase uses `async/await`. Mixing promise chain syntax creates inconsistency and harder-to-debug stack traces.

```js
// ✅ GOOD
const wallet = await walletRepository.findById(walletId);

// ❌ BAD
walletRepository.findById(walletId)
  .then(wallet => { ... })
  .catch(err => { ... });
```

### Rule 3.2 — Parallel async operations MUST use `Promise.all`, not sequential `await`.

When multiple independent async calls are needed, run them concurrently.

```js
// ✅ GOOD — concurrent fetch
const walletsWithBalance = await Promise.all(
  wallets.map(wallet => walletRepository.getWalletBalance(wallet.id))
);

// ❌ BAD — sequential await (unnecessarily slow)
for (const wallet of wallets) {
  const balance = await walletRepository.getWalletBalance(wallet.id); // ❌ Waits one by one
}
```

### Rule 3.3 — Service methods MUST be `async` even if they currently only do synchronous work.

This provides a stable contract — callers always `await` service methods, so adding a DB call later will never break the API.

```js
// ✅ GOOD
async validateType(type) {
  if (!['income', 'expense'].includes(type)) {
    throw new AppError(ERROR_MESSAGES.INVALID_TRANSACTION_TYPE, 400, 'INVALID_TYPE');
  }
},

// ❌ BAD — synchronous service method
validateType(type) { // ❌ Forces callers to know it's not async
  if (!['income', 'expense'].includes(type)) throw new Error('...');
},
```

---

## 3. Data Validation

### Rule 4.1 — Input validation MUST happen at the Route/Controller boundary before data reaches a Service.

Services MUST receive only clean, pre-validated data. They MUST NOT re-validate HTTP input format. The controller (or a dedicated validation middleware) is the gatekeeper.

### Rule 4.2 — Use Zod for schema-based validation. Inline `if (!field)` checks are reserved for simple required-field guards only.

For any endpoint with multiple fields or complex constraints, a Zod schema MUST be defined in a validator file and applied as middleware on the route.

**Implementation — `middleware/validators/walletValidators.js`:**
```js
// ✅ GOOD — middleware/validators/walletValidators.js
import { z } from 'zod';
import ApiResponse from '../../utils/responseUtils.js';

const createWalletSchema = z.object({
  name: z.string().min(1, 'Tên ví là bắt buộc').max(255),
  initial_balance: z.number().int().min(0).optional().default(0),
  currency: z.string().max(10).optional().default('VND'),
  icon_id: z.string().max(255).optional(),
});

export const validateCreateWallet = (req, res, next) => {
  const result = createWalletSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return ApiResponse.badRequest(res, 'Dữ liệu không hợp lệ', errors);
  }
  req.body = result.data; // Attach parsed & coerced data back to req.body
  next();
};
```

**Route wires it in before the controller:**
```js
// ✅ GOOD — route applies validator middleware
router.post('/', validateCreateWallet, walletController.createWallet);
```

**Controller receives clean data — no format checks needed:**
```js
// ✅ GOOD — controller trusts its input is already validated
async createWallet(req, res, next) {
  try {
    const wallet = await walletService.createWallet(req.user.userId, req.body);
    return ApiResponse.created(res, wallet, 'Tạo ví thành công');
  } catch (error) {
    next(error);
  }
},
```

```js
// ❌ BAD — validation in the controller, service, AND route (tripled effort)
async createWallet(req, res) {
  if (!req.body.name) return ApiResponse.badRequest(res, 'Name required'); // ❌
  if (req.body.initial_balance < 0) return ApiResponse.badRequest(...);    // ❌
  ...
}
```

### Rule 4.3 — Validated data MUST replace `req.body` after parsing.

The Zod `safeParse` result includes coerced types and applied defaults. The validator middleware MUST write `req.body = result.data` so the controller and service work with clean, typed data — not raw strings from the request body.

```js
// ✅ GOOD — in the validator middleware after successful parse
req.body = result.data; // Overwrites raw body with parsed, coerced, defaulted data
next();
```

### Rule 4.4 — Route parameters (`:walletId`, `:transactionId`, etc.) MUST be validated for format.

UUID format validation prevents service and repository calls with obviously invalid IDs.

```js
// ✅ GOOD — reusable UUID param validator
const uuidSchema = z.string().uuid('ID không hợp lệ');

export const validateUuidParam = (paramName) => (req, res, next) => {
  const result = uuidSchema.safeParse(req.params[paramName]);
  if (!result.success) {
    return ApiResponse.badRequest(res, `${paramName} không hợp lệ`);
  }
  next();
};

// Usage:
router.get('/:walletId', validateUuidParam('walletId'), walletController.getWalletById);
```

---

## 4. Security Standards

### Rule 5.1 — `userId` MUST always originate from the verified JWT. Never from the request body or query string.

The `authenticateToken` middleware verifies the JWT and populates `req.user = { userId, email }`. This is the only trusted source of identity.

```js
// ✅ GOOD
const userId = req.user.userId; // Populated by verified JWT

// ❌ BAD — client can forge this
const userId = req.body.userId;
const userId = req.query.userId;
```

### Rule 5.2 — Passwords MUST be hashed with bcrypt (10 salt rounds) before storage. Never store or log plaintext passwords.

```js
// ✅ GOOD — utils/passwordUtils.js pattern
const hashedPassword = await passwordUtils.hashPassword(password); // bcrypt, 10 rounds
await userRepository.create({ ...userData, password: hashedPassword });

// ❌ BAD
await userRepository.create({ ...userData, password: password }); // ❌ Plaintext stored
logger.info('User password:', password);                          // ❌ Logged in plaintext
```

### Rule 5.3 — JWT tokens MUST NOT be logged at any level.

The token value itself MUST NEVER appear in any `logger.*` call. Log only the `userId` extracted from the decoded payload.

```js
// ✅ GOOD
logger.info('Token generated for userId:', payload.userId);

// ❌ BAD
logger.debug('Generated token:', token); // ❌ Token value in logs
logger.info('Login token:', result.token); // ❌
```

### Rule 5.4 — Sensitive user data MUST be stripped before returning from a repository or service.

The `password` field MUST be excluded from all user-facing responses. Use Prisma `select` to prevent accidental exposure.

```js
// ✅ GOOD — userRepository.js uses explicit select
async findById(id) {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      full_name: true,
      email: true,
      avatar_url: true,
      auth_provider: true,
      created_at: true,
      // password intentionally omitted
    },
  });
},

// ❌ BAD — returns entire row including password hash
async findById(id) {
  return await prisma.user.findUnique({ where: { id } }); // ❌ password field exposed
}
```

### Rule 5.5 — CORS MUST be configured via environment variables. Wildcard origins are forbidden in production.

```js
// ✅ GOOD — app.js
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

// ❌ BAD
app.use(cors()); // ❌ Allows all origins, including malicious ones
app.use(cors({ origin: '*' })); // ❌ Same problem
```

---

## 5. Logging Standards

### Rule 6.1 — Use the project `logger` singleton exclusively. `console.log` is forbidden in all source files.

```js
// ✅ GOOD
import { logger } from '../utils/logger.js';
logger.info('Operation context:', value);

// ❌ BAD
console.log('Something happened'); // ❌ Bypasses log level control
console.error('Error:', err);      // ❌
```

### Rule 6.2 — Apply consistent log levels for consistent observability.

| Level | Method | When to Use |
|---|---|---|
| `info` | `logger.info()` | Service method entry; significant state changes (user created, wallet deleted) |
| `debug` | `logger.debug()` | Intermediate values during processing; DB lookup results. **No-op in production.** |
| `warn` | `logger.warn()` | Recoverable issues; deprecated usage patterns |
| `error` | `logger.error()` | Unexpected exceptions; always pass the full `error` object as the second argument |

```js
// ✅ GOOD — correct level usage pattern
logger.info('TransactionService.createTransaction for userId:', userId); // Entry
logger.debug('TransactionService: wallet found:', wallet.id);           // Intermediate
logger.error('TransactionService.createTransaction failed:', error);    // Exception
```

### Rule 6.3 — logger.error() MUST always receive the error object, not just error.message.

Passing only `error.message` loses the stack trace. Pass the full `error` object.

```js
// ✅ GOOD
logger.error('Create wallet error:', error); // Full stack trace preserved

// ❌ BAD
logger.error('Create wallet error:', error.message); // ❌ Stack trace lost
```

### Rule 6.4 — MUST NOT log the following: passwords, tokens, credit card numbers, or any PII beyond email and userId.

```js
// ✅ GOOD — log identity, not content
logger.info('Login request for:', email);
logger.info('AuthService.register created user id:', user.id);

// ❌ BAD
logger.info('Login payload:', { email, password }); // ❌ Password logged
logger.debug('Token issued:', token);               // ❌ Token logged
logger.info('User data:', user);                    // ❌ May contain password hash
```

---

## 6. BigInt & Prisma Data Patterns

### Rule 7.1 — All monetary/balance fields MUST be handled as BigInt internally and String externally.

SQL Server `BigInt` columns (`amount`, `initial_balance`, `target_amount`) require explicit conversion at the service boundary.

| Direction | Action | Code |
|---|---|---|
| **Input** (client → service) | Convert `number` string from request body to `BigInt` | `BigInt(req.body.amount)` |
| **Storage** (service → repository) | Pass `BigInt` value to Prisma | `amount: BigInt(data.amount)` |
| **Output** (service → controller) | Convert `BigInt` back to `String` | `amount: result.amount.toString()` |

```js
// ✅ GOOD — full lifecycle in a service method
async createTransaction(userId, { amount, ...rest }) {
  const newTransaction = await transactionRepository.create({
    ...rest,
    amount: BigInt(amount), // ✅ Convert to BigInt for storage
  });

  return {
    ...newTransaction,
    amount: newTransaction.amount.toString(), // ✅ Convert back to String for response
  };
},

// ❌ BAD — BigInt returned raw; will throw a JSON serialization error
return newTransaction; // ❌ newTransaction.amount is BigInt — JSON.stringify() will crash
```

### Rule 7.2 — The global BigInt JSON replacer in `app.js` is a safety net, NOT a substitute for explicit serialization.

`app.js` registers a global JSON replacer as a last-resort fallback:
```js
app.set('json replacer', (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
);
```
Services MUST still serialize BigInt fields explicitly with `.toString()`. Do not rely on the global replacer as your primary strategy — it obscures bugs and makes return types unpredictable.

### Rule 7.3 — Repositories MUST use Prisma `select` to omit sensitive or unnecessary fields on user-facing queries.

Fetching entire rows and then stripping fields in the service is wasteful and error-prone. Use `select` at the source.

```js
// ✅ GOOD — only fetch what is needed
async findById(id) {
  return await prisma.user.findUnique({
    where: { id },
    select: { id: true, full_name: true, email: true, avatar_url: true, created_at: true },
  });
},

// ❌ BAD — fetches password hash; relies on service to strip it
async findById(id) {
  return await prisma.user.findUnique({ where: { id } }); // ❌ Returns password
}
```

### Rule 7.4 — Avoid N+1 queries. Use `Promise.all` for batch fetches; use Prisma `include` for relational data when appropriate.

```js
// ❌ BAD — N+1: one DB query per wallet
for (const wallet of wallets) {
  wallet.balance = await walletRepository.getWalletBalance(wallet.id); // N queries
}

// ✅ GOOD — concurrent queries
const walletsWithBalance = await Promise.all(
  wallets.map(w => walletRepository.getWalletBalance(w.id))
);
```

### Rule 7.5 — Soft-delete MUST be used for Wallets. Hard-delete for all other resources.

```js
// ✅ GOOD — wallets use soft-delete
await walletRepository.softDelete(walletId); // Sets is_active = false

// ✅ GOOD — all other resources use hard-delete
await transactionRepository.delete(transactionId);
await categoryRepository.delete(categoryId);
await budgetRepository.delete(budgetId);

// ❌ BAD — hard-deleting a wallet
await walletRepository.delete(walletId); // ❌ Cascades and destroys transaction history
```

### Rule 7.6 — All `findMany` queries on `wallets` MUST filter by `is_active: true`.

Soft-deleted wallets MUST be invisible to all business operations.

```js
// ✅ GOOD
await prisma.wallet.findMany({
  where: { user_id: userId, is_active: true }, // ✅ Excludes soft-deleted wallets
});

// ❌ BAD
await prisma.wallet.findMany({
  where: { user_id: userId }, // ❌ Returns soft-deleted wallets too
});
```

---

## 7. Module & Import Standards

### Rule 8.1 — ES Modules MUST be used exclusively. CommonJS is forbidden.

The project uses `"type": "module"` in `package.json`. Every file MUST use `import/export`. `require()` and `module.exports` are absolutely forbidden.

```js
// ✅ GOOD
import express from 'express';
import walletController from '../controllers/walletController.js';
export default walletController;
export const walletService = { ... };

// ❌ BAD
const express = require('express');      // ❌ CommonJS
module.exports = walletController;      // ❌ CommonJS
```

### Rule 8.2 — All import paths MUST include the `.js` file extension.

Node.js ESM requires explicit file extensions. Omitting `.js` will cause a runtime `ERR_MODULE_NOT_FOUND` error.

```js
// ✅ GOOD
import walletRepository from '../repositories/walletRepository.js';
import { logger } from '../utils/logger.js';

// ❌ BAD
import walletRepository from '../repositories/walletRepository'; // ❌ Missing .js
import { logger } from '../utils/logger';                        // ❌ Missing .js
```

### Rule 8.3 — Within layer files, use relative imports. The `#` path aliases are reserved for `app.js` only.

The Node subpath aliases (`#controllers/*`, `#services/*`, etc.) are defined in `package.json` and are used **only** in `app.js` to mount the root router. Inside all other files, use relative paths.

```js
// ✅ GOOD — inside controllers/walletController.js
import { walletService } from '../services/walletService.js';
import ApiResponse from '../utils/responseUtils.js';

// ✅ GOOD — in app.js only
import Route from '#routes/index.js';

// ❌ BAD — using # alias inside a controller
import { walletService } from '#services/walletService.js'; // ❌ Reserved for app.js
```

### Rule 8.4 — Import order MUST follow this sequence within every file.

1. Node built-ins (`path`, `url`, `crypto`)
2. Third-party packages (`express`, `prisma`, `zod`)
3. Internal absolute-alias imports (only in `app.js`)
4. Relative imports (grouped by layer: repositories, services, utils, middleware)

```js
// ✅ GOOD — ordered imports
import express from 'express';                                      // 1. third-party
import { walletService } from '../services/walletService.js';       // 2. service (relative)
import ApiResponse from '../utils/responseUtils.js';                // 3. util (relative)
import { ERROR_MESSAGES } from '../utils/errorMessages.js';         // 4. util (relative)
import { logger } from '../utils/logger.js';                        // 5. util (relative)
```

---

## 8. Master Pre-Commit Checklist

Before submitting any new code, verify every item on this list. A "No" on any item means the code MUST be revised.

### Architecture
- [ ] Does Prisma appear only in `repositories/*.js` files?
- [ ] Does every controller method call exactly one service method?
- [ ] Are all business rules (ownership checks, enum validation, limits) in the service layer?
- [ ] Is the 4-layer chain (Route → Controller → Service → Repository) unbroken?

### Async Code
- [ ] Are all async functions protected by `try/catch` or `catchAsync`?
- [ ] Are there zero `.then()/.catch()` chains anywhere in the changed files?
- [ ] Are independent async calls run with `Promise.all` rather than sequential `await`?

### Validation
- [ ] Is a Zod schema validator middleware applied on every POST/PUT/PATCH route?
- [ ] Does every validator middleware set `req.body = result.data` on success?
- [ ] Are UUID route parameters validated before reaching the controller?

### Security
- [ ] Is `userId` extracted exclusively from `req.user.userId`?
- [ ] Are passwords hashed with `passwordUtils.hashPassword()` before storage?
- [ ] Are passwords and tokens absent from all `logger.*` calls?
- [ ] Does every new `findById` / `create` on `user` use `select` to omit the `password` field?

### BigInt & Data
- [ ] Are all BigInt monetary values converted with `BigInt()` before repository calls?
- [ ] Are all BigInt fields serialized with `.toString()` before service returns?
- [ ] Do all wallet `findMany` queries filter by `is_active: true`?
- [ ] Does any wallet deletion use `softDelete` (not `delete`)?

### Modules & Imports
- [ ] Do all import paths end with `.js`?
- [ ] Is `require()` absent from all changed files?
- [ ] Are `#` path aliases used only in `app.js`?
