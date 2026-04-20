import { z } from 'zod';
import ApiResponse from '../../utils/responseUtils.js';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Tên danh mục là bắt buộc' })
    .min(1, 'Tên danh mục là bắt buộc')
    .max(255),
  type: z.enum(['INCOME', 'EXPENSE'], {
    required_error: 'Loại danh mục là bắt buộc',
    invalid_type_error: 'Loại danh mục không hợp lệ. Chỉ chấp nhận INCOME hoặc EXPENSE',
  }),
  icon_name: z.string().max(255).optional().nullable(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(255).optional(),
  type: z
    .enum(['INCOME', 'EXPENSE'], {
      invalid_type_error: 'Loại danh mục không hợp lệ. Chỉ chấp nhận INCOME hoặc EXPENSE',
    })
    .optional(),
  icon_name: z.string().max(255).optional().nullable(),
  is_active: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Middleware
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

export const validateCreateCategory = makeValidator(createCategorySchema);
export const validateUpdateCategory = makeValidator(updateCategorySchema);
