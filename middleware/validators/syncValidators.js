import { z } from 'zod';
import ApiResponse from '../../utils/responseUtils.js';

// ---------------------------------------------------------------------------
// Shared schemas for individual records within the push payload
// ---------------------------------------------------------------------------

// All monetary values arrive as strings (since JSON cannot represent BigInt)
const walletSyncSchema = z.object({
  id: z.string().uuid('wallet id không hợp lệ'),
  user_id: z.string().uuid('user_id không hợp lệ'),
  name: z.string().min(1).max(255),
  initial_balance: z.union([z.string(), z.number()]).transform(String).optional(),
  currency: z.string().max(10).optional().nullable(),
  icon_id: z.string().max(255).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  deleted_at: z.string().datetime({ offset: true }).optional().nullable(),
});

const categorySyncSchema = z.object({
  id: z.string().uuid('category id không hợp lệ'),
  user_id: z.string().uuid('user_id không hợp lệ').optional().nullable(),
  name: z.string().min(1).max(255),
  type: z.enum(['income', 'expense']),
  icon_name: z.string().max(255).optional().nullable(),
  is_active: z.boolean().optional().default(true),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  deleted_at: z.string().datetime({ offset: true }).optional().nullable(),
});

const transactionSyncSchema = z.object({
  id: z.string().uuid('transaction id không hợp lệ'),
  wallet_id: z.string().uuid('wallet_id không hợp lệ'),
  category_id: z.union([z.string().min(1, 'category_id không hợp lệ'), z.literal('')]).transform(v => v === '' ? null : v).optional().nullable(),
  amount: z.union([z.string(), z.number()]).transform(String),
  transaction_date: z.string().datetime({ offset: true }),
  note: z.string().max(1000).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  deleted_at: z.string().datetime({ offset: true }).optional().nullable(),
});

const budgetSyncSchema = z.object({
  id: z.string().uuid('budget id không hợp lệ'),
  wallet_id: z.string().uuid('wallet_id không hợp lệ'),
  category_id: z.string().min(1, 'category_id không hợp lệ'),
  target_amount: z.union([z.string(), z.number()]).transform(String),
  start_date: z.string().datetime({ offset: true }).optional().nullable(),
  end_date: z.string().datetime({ offset: true }).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  deleted_at: z.string().datetime({ offset: true }).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Push body schema — wraps arrays of each model's sync records
// ---------------------------------------------------------------------------

const syncPushSchema = z.object({
  wallets: z.array(walletSyncSchema).optional().default([]),
  categories: z.array(categorySyncSchema).optional().default([]),
  transactions: z.array(transactionSyncSchema).optional().default([]),
  budgets: z.array(budgetSyncSchema).optional().default([]),
});

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

function makeValidator(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues ?? result.error.errors ?? [];
      const errors = issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return ApiResponse.badRequest(res, 'Dữ liệu không hợp lệ', errors);
    }
    req.body = result.data;
    next();
  };
}

export const validateSyncPush = makeValidator(syncPushSchema);
