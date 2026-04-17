# SOA Guidelines — QLCT Server

> **Audience:** AI coding assistants and human developers working on this codebase.
> **Authority:** These rules take precedence over generic "best practice" advice. When in doubt, follow what is written here.
> **Scope:** All code added or modified in this repository MUST conform to every rule in this document.

---

## 0. The Guiding Principle

This backend is a **Service-Oriented Architecture (SOA)**. That means the system is carved into a set of **autonomous, business-capability-driven services**. Each service owns its domain completely and communicates with the outside world only through well-defined contracts (function signatures + documented inputs/outputs). No service may reach inside another service's internals.

---

## 1. Business-Driven Service Boundaries

### Rule 1.1 — Services MUST map to business capabilities, not database tables.

Services represent **what the business does**, not what the schema looks like.

| ✅ Correct Service Boundary | ❌ Wrong (table-driven) |
|---|---|
| `walletService` — manages wallet lifecycle and real-time balance | `walletsTableService` |
| `transactionService` — records spending/income and provides statistics | `transactionsTableService` |
| `budgetService` — tracks budget targets and spending progress | `budgetsTableService` |
| `authService` — handles identity, authentication, and credential management | `usersTableService` |
| `categoryService` — manages user-defined classification labels | `categoriesTableService` |

### Rule 1.2 — A service MUST own exactly one business capability.

A service file MUST NOT mix multiple business domains. If `walletService.js` starts containing transaction aggregation logic beyond what is needed to compute a wallet's balance, that logic MUST be moved to `transactionService`.

### Rule 1.3 — New services MUST be justified by a new business capability.

Before creating a new service file, you MUST be able to answer: *"What distinct business function does this encapsulate?"* Creating a service just because a new DB table was added is NOT a valid reason.

---

## 2. Layer Architecture — Strict Boundaries

### Rule 2.1 — The 4-layer call chain is the ONLY valid execution path.

```
Route  →  Controller  →  Service  →  Repository  →  Database
```

- **MUST NOT** skip layers. A Controller MUST NOT call a Repository directly.
- **MUST NOT** invert layers. A Repository MUST NOT call a Service.
- **MUST NOT** merge layers. Logic from two layers MUST NOT be placed in a single file.

### Rule 2.2 — Each layer has a fixed responsibility. It MUST NOT do anything else.

| Layer | MUST do | MUST NOT do |
|---|---|---|
| **Route** | Declare HTTP method, path, and middleware chain | Contain any business or data logic |
| **Controller** | Parse `req`, validate HTTP input, call one service method, return `ApiResponse.*()` | Touch Prisma, make direct DB queries, contain business rules |
| **Service** | Enforce business rules, check ownership, orchestrate repository calls, throw `ERROR_MESSAGES` | Access `req`/`res`, call `ApiResponse`, import Prisma directly |
| **Repository** | Execute Prisma queries and compute DB-level aggregations | Contain ownership checks, throw domain errors, know about HTTP |

### Rule 2.3 — Controllers MUST be thin. Services MUST be fat.

All decision-making logic (authorization, validation of business rules, conditional branching on data) MUST live in the Service layer. The Controller's only job is to translate HTTP → Service call → HTTP response.

---

## 3. Service Contracts (Inputs & Outputs)

### Rule 3.1 — Every public service method MUST have a JSDoc contract.

Every exported service method MUST document its complete contract. No exceptions.

```js
/**
 * Brief description of what the business operation does.
 * @param {string} userId - The ID of the requesting user (for ownership checks).
 * @param {Object} data - Input data object.
 * @param {string} data.fieldName - Description and constraints.
 * @returns {Promise<Object>} Description of the returned shape.
 * @throws {Error} ERROR_MESSAGES.RESOURCE_NOT_FOUND — when the resource does not exist.
 * @throws {Error} ERROR_MESSAGES.RESOURCE_ACCESS_DENIED — when userId does not own the resource.
 */
```

### Rule 3.2 — Service method signatures MUST be explicit. No opaque argument objects without documentation.

**MUST NOT:**
```js
async doSomething(params) { ... } // ❌ What is in params? Unknown contract.
```

**MUST:**
```js
async createWallet(userId, { name, initial_balance, currency, icon_id }) { ... } // ✅ Clear contract
```

### Rule 3.3 — Service return values MUST be plain, serializable JavaScript objects.

- **MUST NOT** return raw Prisma model instances with live `BigInt` fields unprocessed.
- **MUST** convert all `BigInt` fields to `String` before returning from a service method: `amount: result.amount.toString()`.
- **MUST NOT** return database-internal fields not meant for consumers (e.g., raw join artifacts).

### Rule 3.4 — Services MUST accept primitive/plain-object inputs only.

A service method MUST NOT accept `req`, `res`, `next`, or any Express-specific object as a parameter. HTTP context MUST NOT leak into the Service layer.

---

## 4. Loose Coupling & Inter-Service Communication

### Rule 4.1 — Services MUST NOT import other services.

Services are autonomous units. Direct service-to-service calls create tight coupling and circular dependency risks.

**MUST NOT:**
```js
// Inside budgetService.js
import { walletService } from './walletService.js'; // ❌ Service importing service
const wallet = await walletService.getWalletById(walletId, userId);
```

**MUST:** When one service needs data owned by another domain, it MUST call the relevant **Repository** directly to read only the data it needs, or it MUST receive the already-validated data as an input parameter from the Controller.

```js
// Inside budgetService.js
import walletRepository from '../repositories/walletRepository.js'; // ✅ Access via repository
const wallet = await walletRepository.findById(walletId);
if (!wallet || wallet.user_id !== userId) {
  throw new Error(ERROR_MESSAGES.BUDGET_ACCESS_DENIED);
}
```

### Rule 4.2 — Services MUST communicate via documented contracts, not shared state.

- **MUST NOT** share in-memory state, singleton objects with mutable state, or global variables between services.
- **MUST NOT** rely on another service having already modified the database as a side-effect.
- Each service MUST fetch the data it needs independently and verify it against its own rules.

### Rule 4.3 — Ownership verification MUST be self-contained within each service.

Each service MUST independently verify that the `userId` owns the resource being operated on. A service MUST NOT trust that a previous service call has already performed this check.

```js
// ✅ budgetService verifies wallet ownership itself — does not trust that walletService already did
const wallet = await walletRepository.findById(budget.wallet_id);
if (!wallet || wallet.user_id !== userId) {
  throw new Error(ERROR_MESSAGES.BUDGET_ACCESS_DENIED);
}
```

---

## 5. Error Handling Contract

### Rule 5.1 — All domain error messages MUST be declared in `utils/errorMessages.js`.

Before throwing any new error, the message key MUST be added to `ERROR_MESSAGES` in `utils/errorMessages.js`. Hard-coding string literals inside a service or controller is forbidden.

**MUST NOT:**
```js
throw new Error('Budget not found'); // ❌ Hard-coded string
```

**MUST:**
```js
// utils/errorMessages.js — add first:
BUDGET_NOT_FOUND: 'Không tìm thấy ngân sách',

// then in the service:
throw new Error(ERROR_MESSAGES.BUDGET_NOT_FOUND); // ✅
```

### Rule 5.2 — Services MUST throw, Controllers MUST catch.

- **Services** MUST signal domain errors by throwing plain `Error` objects with `ERROR_MESSAGES` strings.
- **Controllers** MUST catch these errors and map them to the correct `ApiResponse` HTTP status.
- **MUST NOT** call `ApiResponse` methods inside a service.
- **MUST NOT** throw HTTP status codes from a service (e.g., `new Error('403')`).

### Rule 5.3 — Controllers MUST map every known service error to a specific HTTP response.

Every error that a service documents in its `@throws` JSDoc MUST have a corresponding `if (error.message === ERROR_MESSAGES.X)` handler in the catching controller method.

```js
// ✅ Every known domain error is explicitly handled
} catch (error) {
  if (error.message === ERROR_MESSAGES.BUDGET_NOT_FOUND) {
    return ApiResponse.notFound(res, error.message);
  }
  if (error.message === ERROR_MESSAGES.BUDGET_UPDATE_DENIED) {
    return ApiResponse.forbidden(res, error.message);
  }
  logger.error('Update budget error:', error); // Log unknown errors
  return ApiResponse.error(res, error.message); // Generic 500 fallback
}
```

### Rule 5.4 — Unknown errors MUST be logged and MUST return a generic 500.

An unhandled error that escapes the known `ERROR_MESSAGES` checks MUST be logged with `logger.error()` and returned as `ApiResponse.error(res, error.message)`. Silent swallowing of errors is forbidden.

---

## 6. Data Ownership & Authorization

### Rule 6.1 — Every mutating operation MUST verify resource ownership before execution.

For every `update` and `delete` operation, the service MUST:
1. Fetch the resource first.
2. Verify it exists (throw `*_NOT_FOUND` if not).
3. Verify `resource.owner_id === userId` (throw `*_ACCESS_DENIED` or `*_UPDATE_DENIED` / `*_DELETE_DENIED` if not).
4. Only then perform the mutation.

### Rule 6.2 — Indirect ownership MUST be traced through the ownership chain.

For resources without a direct `user_id` field (e.g., `Transaction`, `Budget`), ownership MUST be verified by fetching the parent resource and checking its `user_id`.

```
Budget.wallet_id → Wallet.user_id === userId  ✅ Valid ownership trace
Transaction.wallet_id → Wallet.user_id === userId  ✅ Valid ownership trace
```

MUST NOT skip this trace and assume the caller is trusted.

### Rule 6.3 — `userId` MUST always originate from the verified JWT, never from the request body.

**MUST NOT:**
```js
const { userId } = req.body; // ❌ Client-supplied user ID — cannot be trusted
```

**MUST:**
```js
const userId = req.user.userId; // ✅ Populated by authenticateToken middleware from verified JWT
```

---

## 7. Repository Rules

### Rule 7.1 — Repositories MUST be the only layer that imports and uses Prisma.

`import prisma from '../config/database.js'` MUST appear only in repository files. No service, controller, route, or middleware file may import Prisma directly.

### Rule 7.2 — Repositories MUST be generic data-access components, not business logic units.

A repository method MUST NOT enforce ownership rules, check enum validity, or make decisions about whether an operation is allowed. It executes the query it is given.

### Rule 7.3 — Repositories MUST NOT call services or other repositories in a cyclic manner.

A repository may only import `prisma`. It MUST NOT import any service or any other repository file.

### Rule 7.4 — Computed fields MUST remain in repositories, not services.

DB-level aggregations (e.g., computing `current_balance` from all transactions, computing `total_spent` for a budget) MUST be implemented inside specific repository methods (e.g., `walletRepository.getWalletBalance()`, `budgetRepository.getTotalSpent()`). Services MUST call these methods and MUST NOT re-implement the computation logic.

---

## 8. Shared Contracts — Not Shared Implementation

### Rule 8.1 — `utils/errorMessages.js` is the shared contract for all domain errors.

This file is the single source of truth for error strings. Every layer reads from it; no layer writes its own error strings independently.

### Rule 8.2 — `utils/responseUtils.js` (ApiResponse) is the shared contract for all HTTP responses.

All HTTP response formatting MUST go through `ApiResponse` static methods. No layer may bypass it to write raw JSON.

### Rule 8.3 — The Prisma schema (`prisma/schema.prisma`) is the shared contract for data shapes.

All field names, types, and relationships are defined there. Services and repositories MUST use the exact field names from the schema (e.g., `wallet_id`, `initial_balance`, `transaction_date`). Never alias or rename schema fields within a layer; serialize to client-friendly names only at the response boundary if needed.

### Rule 8.4 — Services MUST NOT share mutable state via module-level variables.

Service files MUST NOT declare module-level mutable variables that accumulate state across requests. All state must come from the database via repositories.

---

## 9. Adding a New Service (Step-by-Step Checklist)

When adding any new business capability, follow this sequence in order:

- [ ] **Define the business capability** in one sentence. If it cannot be stated clearly, do not proceed.
- [ ] **Add error keys** to `utils/errorMessages.js` for all new domain errors.
- [ ] **Update `prisma/schema.prisma`** if new data is required, then run `npm run prisma:push && npm run prisma:generate`.
- [ ] **Create `repositories/newResourceRepository.js`** — pure Prisma CRUD + any DB aggregations.
- [ ] **Create `services/newResourceService.js`** — business logic, ownership checks, BigInt serialization, JSDoc on every method.
- [ ] **Create `controllers/newResourceController.js`** — HTTP input validation, one service call per handler, full error mapping.
- [ ] **Create `routes/newResourceRoutes.js`** — apply `router.use(authenticateToken)` at the top; declare all routes.
- [ ] **Register the route** in `routes/index.js` under `v1Router.use('/new-resource', newResourceRoutes)`.
- [ ] **Verify**: Does any new service method import another service? → Fix it. Does any controller call Prisma? → Fix it. Does any repository contain an `if (owner !== userId)` check? → Fix it.

---

## 10. Quick Violation Reference

Use this table to instantly identify and fix common SOA violations.

| Symptom | Violation | Fix |
|---|---|---|
| `import prisma from ...` appears in a controller or service | Rule 7.1 | Move the query to a repository method |
| `import { walletService } from ...` appears in `budgetService.js` | Rule 4.1 | Import `walletRepository` instead |
| A service method has `(req, res)` parameters | Rule 3.4 | Pass extracted values (`userId`, `data`) instead |
| `res.status(403).json(...)` appears in a service | Rule 5.2 | Throw `new Error(ERROR_MESSAGES.X)` and catch in controller |
| `throw new Error('some hard-coded string')` in a service | Rule 5.1 | Add key to `ERROR_MESSAGES` and reference it |
| `const userId = req.body.userId` in a controller | Rule 6.3 | Use `req.user.userId` from the JWT middleware |
| An `update` handler that never checks ownership | Rule 6.1 | Fetch resource first, verify `user_id`, then update |
| A repository method containing `if (wallet.user_id !== userId)` | Rule 7.2 | Move ownership check to the calling service |
| A service file contains logic for two different domains | Rule 1.2 | Split into two separate service files |
| BigInt returned directly from service without `.toString()` | Rule 3.3 | Serialize: `amount: result.amount.toString()` |
