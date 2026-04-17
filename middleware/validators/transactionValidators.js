import { z } from 'zod';
import ApiResponse from '../../utils/responseUtils.js';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createTransactionSchema = z.object({
  wallet_id: z.string({ required_error: 'Ví là bắt buộc' }).uuid('wallet_id không hợp lệ'),
  category_id: z.string().uuid('category_id không hợp lệ').optional().nullable(),
  amount: z.coerce
    .number({ required_error: 'Số tiền là bắt buộc' })
    .int()
    .positive('Số tiền phải lớn hơn 0'),
  type: z.enum(['income', 'expense'], {
    required_error: 'Loại giao dịch là bắt buộc',
    invalid_type_error: 'Loại giao dịch không hợp lệ. Chỉ chấp nhận income hoặc expense',
  }),
  transaction_date: z.string().datetime({ offset: true }).optional(),
  icon_id: z.string().max(255).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

const updateTransactionSchema = z.object({
  category_id: z.string().uuid('category_id không hợp lệ').optional().nullable(),
  amount: z.coerce.number().int().positive('Số tiền phải lớn hơn 0').optional(),
  type: z
    .enum(['income', 'expense'], {
      invalid_type_error: 'Loại giao dịch không hợp lệ. Chỉ chấp nhận income hoặc expense',
    })
    .optional(),
  transaction_date: z.string().datetime({ offset: true }).optional(),
  icon_id: z.string().max(255).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

function makeValidator(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
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
