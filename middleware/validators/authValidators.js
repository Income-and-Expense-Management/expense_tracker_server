import { z } from 'zod';
import ApiResponse from '../../utils/responseUtils.js';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email('Email không hợp lệ'),
  password: z
    .string({ required_error: 'Mật khẩu là bắt buộc' })
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  full_name: z.string().max(255).optional(),
  avatar_url: z.string().url('URL avatar không hợp lệ').optional(),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email('Email không hợp lệ'),
  password: z.string({ required_error: 'Mật khẩu là bắt buộc' }).min(1),
});

const googleLoginSchema = z.object({
  id_token: z.string({ required_error: 'Google ID token là bắt buộc' }).min(1),
  email: z
    .string({ required_error: 'Email là bắt buộc' })
    .email('Email không hợp lệ'),
  full_name: z.string().max(255).optional(),
});

const updateProfileSchema = z.object({
  full_name: z.string().max(255).optional(),
  avatar_url: z.string().url('URL avatar không hợp lệ').optional().nullable(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string({ required_error: 'Mật khẩu cũ là bắt buộc' }).min(1),
  newPassword: z
    .string({ required_error: 'Mật khẩu mới là bắt buộc' })
    .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});

// ---------------------------------------------------------------------------
// Middleware factories
// ---------------------------------------------------------------------------

/**
 * Wraps any Zod schema into an Express validation middleware.
 * On success, replaces req.body with the parsed & coerced data.
 */
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

export const validateRegister = makeValidator(registerSchema);
export const validateLogin = makeValidator(loginSchema);
export const validateGoogleLogin = makeValidator(googleLoginSchema);
export const validateUpdateProfile = makeValidator(updateProfileSchema);
export const validateChangePassword = makeValidator(changePasswordSchema);
