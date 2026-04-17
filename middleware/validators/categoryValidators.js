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
  type: z.enum(['income', 'expense'], {
    required_error: 'Loại danh mục là bắt buộc',
    invalid_type_error: 'Loại danh mục không hợp lệ. Chỉ chấp nhận income hoặc expense',
  }),
  icon_name: z.string().max(255).optional().nullable(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(255).optional(),
  type: z
    .enum(['income', 'expense'], {
      invalid_type_error: 'Loại danh mục không hợp lệ. Chỉ chấp nhận income hoặc expense',
    })
    .optional(),
  icon_name: z.string().max(255).optional().nullable(),
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

export const validateCreateCategory = makeValidator(createCategorySchema);
export const validateUpdateCategory = makeValidator(updateCategorySchema);
