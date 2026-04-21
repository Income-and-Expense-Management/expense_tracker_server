import { z } from 'zod';
import ApiResponse from '../../utils/responseUtils.js';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createTransactionSchema = z.object({
  id: z.string().uuid('id không hợp lệ').optional(),
  wallet_id: z.string({ required_error: 'Ví là bắt buộc' }).uuid('wallet_id không hợp lệ'),
  category_id: z.union([z.string().min(1, 'category_id không hợp lệ'), z.literal('')]).transform(v => v === '' ? null : v).optional().nullable(),
  amount: z.coerce
    .number({ required_error: 'Số tiền là bắt buộc' })
    .int()
    .positive('Số tiền phải lớn hơn 0'),
  transaction_date: z.string().datetime({ offset: true }).optional(),
  note: z.string().max(1000).optional().nullable(),
});

const updateTransactionSchema = z.object({
  category_id: z.union([z.string().min(1, 'category_id không hợp lệ'), z.literal('')]).transform(v => v === '' ? null : v).optional().nullable(),
  amount: z.coerce.number().int().positive('Số tiền phải lớn hơn 0').optional(),
  transaction_date: z.string().datetime({ offset: true }).optional(),
  note: z.string().max(1000).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

function makeValidator(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      console.log('Validation errors:', result.error);
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

export const validateCreateTransaction = makeValidator(createTransactionSchema);
export const validateUpdateTransaction = makeValidator(updateTransactionSchema);
