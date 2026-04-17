# RESTful API Standards — QLCT Server

> **Audience:** AI coding assistants and human developers working on this codebase.
> **Authority:** This document serves as the absolute truth for designing and implementing APIs in this project.
> **Scope:** All new API endpoints and refactorings MUST adhere strictly to these rules. Failure to comply will result in rejected code.

---

## 1. Resource-Based URIs (Nouns, Not Verbs)

REST is centered around **resources**, not actions. The URL MUST identify the resource being operated on.

*   **MUST** use plural nouns for all resources.
    *   ✅ `/api/v1/expenses`
    *   ✅ `/api/v1/categories`
    *   ✅ `/api/v1/wallets`
*   **MUST NOT** use verbs or actions in the URI.
    *   ❌ `/api/v1/getExpenses`
    *   ❌ `/api/v1/createExpense`
    *   ❌ `/api/v1/updateWallet`
*   **MUST** nest resources logically to show relationships, but avoid nesting deeper than two levels.
    *   ✅ `/api/v1/wallets/:walletId/transactions` (Transactions belonging to a specific wallet)
    *   ❌ `/api/v1/users/:userId/wallets/:walletId/transactions/:transactionId` (Too deep)

## 2. Strict HTTP Methods (Verbs)

The HTTP method (verb) defines the action being performed on the resource. You **MUST** strictly enforce the correct usage.

*   **GET:** Retrieve a specific resource or a collection of resources. **MUST NOT** change state.
*   **POST:** Create a new resource. The server determines the new resource's ID.
*   **PUT:** Update a complete resource. The entire resource representation MUST be provided. If fields are omitted, they should be cleared (though partial updates are often practical, PUT is technically full replacement).
*   **PATCH:** Partially update a resource. Only provide the fields that are changing.
*   **DELETE:** Remove a specific resource.

## 3. Standard HTTP Status Codes

You **MUST** return the appropriate HTTP status code to indicate the outcome of the request. All responses MUST be formatted using the shared `ApiResponse` contract (`utils/responseUtils.js`).

| Status Code | Message / ApiResponse Method | When to Use |
| :--- | :--- | :--- |
| **200 OK** | `ApiResponse.success`, `ApiResponse.paginated` | Successful GET, PUT, PATCH, or DELETE (if returning data). |
| **201 Created** | `ApiResponse.created` | Successful POST request resulting in a new resource. |
| **204 No Content**| `ApiResponse.noContent` | Successful request, but no data to return (e.g., successful DELETE). |
| **400 Bad Req.** | `ApiResponse.badRequest` | Validation failed, missing required fields, or malformed JSON. |
| **401 Unauth.** | `ApiResponse.unauthorized` | Missing, invalid, or expired authentication token. |
| **403 Forbidden** | `ApiResponse.forbidden` | User is authenticated but does not own the resource or lack permissions. |
| **404 Not Found** | `ApiResponse.notFound` | The requested resource ID does not exist. |
| **409 Conflict** | `ApiResponse.conflict` | Resource already exists or state conflict (e.g., duplicate email). |
| **500 Server Err**| `ApiResponse.error` | Unhandled, unexpected server exceptions. |

## 4. Statelessness

Every request from the Web or Mobile client **MUST** contain all necessary information to be processed.

*   **MUST NOT** rely on server-side sessions or in-memory state tracking between requests.
*   **MUST** include the authentication token (`Authorization: Bearer <token>`) in the headers of every protected request.
*   The server MUST be able to process the request independently of any previous requests.

---

## 🛑 Strict API Development Checklist

Before finalizing any new route or controller, you **MUST** pass this checklist:

- [ ] **URI Check:** Does the URL use only plural nouns? (If it contains a verb, rewrite it).
- [ ] **Method Check:** Does the HTTP method match the action? (GET=read, POST=create, PUT/PATCH=edit, DELETE=remove).
- [ ] **Input Validation:** Are inputs validated thoroughly in the controller before passing data to the service?
- [ ] **Stateless Check:** Does this endpoint work entirely based on the `req` parameters, body, query, and the JWT token?
- [ ] **Status Code Check:** Are all execution paths covered by the correct HTTP status code?
- [ ] **ApiResponse Check:** Is the response routed exclusively through the `ApiResponse` utility methods?
- [ ] **Error Handling Check:** Are domain errors (from `ERROR_MESSAGES`) mapped correctly in the controller's `catch` block?
