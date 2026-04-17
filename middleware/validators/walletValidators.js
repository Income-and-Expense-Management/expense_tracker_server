import { z } from 'zod';
import ApiResponse from '../../utils/responseUtils.js';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createWalletSchema = z.object({
  name: z
    .string({ required_error: 'Tên ví là bắt buộc' })
    .min(1, 'Tên ví là bắt buộc')
    .max(255),
  initial_balance: z.coerce.number().int().min(0).optional().default(0),
  currency: z.string().max(10).optional().default('VND'),
  icon_id: z.string().max(255).optional().nullable(),
});

const updateWalletSchema = z.object({
  name: z.string().min(1, 'Tên ví không được để trống').max(255).optional(),
  initial_balance: z.coerce.number().int().min(0).optional(),
  currency: z.string().max(10).optional(),
  icon_id: z.string().max(255).optional().nullable(),
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

export const validateCreateWallet = makeValidator(createWalletSchema);
export const validateUpdateWallet = makeValidator(updateWalletSchema);
