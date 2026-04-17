import { z } from 'zod';
import ApiResponse from '../../utils/responseUtils.js';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createBudgetSchema = z.object({
  wallet_id: z.string({ required_error: 'Ví là bắt buộc' }).uuid('wallet_id không hợp lệ'),
  category_id: z
    .string({ required_error: 'Danh mục là bắt buộc' })
    .uuid('category_id không hợp lệ'),
  target_amount: z.coerce
    .number({ required_error: 'Số tiền mục tiêu là bắt buộc' })
    .int()
    .positive('Số tiền mục tiêu phải lớn hơn 0'),
  start_date: z.string().datetime({ offset: true }).optional().nullable(),
  end_date: z.string().datetime({ offset: true }).optional().nullable(),
});

const updateBudgetSchema = z.object({
  category_id: z.string().uuid('category_id không hợp lệ').optional(),
  target_amount: z.coerce
    .number()
    .int()
    .positive('Số tiền mục tiêu phải lớn hơn 0')
    .optional(),
  start_date: z.string().datetime({ offset: true }).optional().nullable(),
  end_date: z.string().datetime({ offset: true }).optional().nullable(),
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

export const validateCreateBudget = makeValidator(createBudgetSchema);
export const validateUpdateBudget = makeValidator(updateBudgetSchema);
