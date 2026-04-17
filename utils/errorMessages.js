/**
 * Centralized error messages for the QLCT Server.
 * Used by services (throw) and controllers (catch + map to HTTP status).
 * Keeps Vietnamese UX messages consistent and prevents controller-service coupling.
 */
export const ERROR_MESSAGES = {
  // Auth
  EMAIL_ALREADY_EXISTS: 'Email đã được sử dụng',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  WRONG_AUTH_PROVIDER: 'Tài khoản này sử dụng phương thức đăng nhập khác',
  WRONG_OLD_PASSWORD: 'Mật khẩu cũ không đúng',
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  INVALID_GOOGLE_TOKEN: 'Google token không hợp lệ hoặc đã hết hạn',

  // Wallet
  WALLET_NOT_FOUND: 'Không tìm thấy ví',
  WALLET_ACCESS_DENIED: 'Bạn không có quyền truy cập ví này',
  WALLET_UPDATE_DENIED: 'Bạn không có quyền cập nhật ví này',
  WALLET_DELETE_DENIED: 'Bạn không có quyền xóa ví này',

  // Transaction
  TRANSACTION_NOT_FOUND: 'Không tìm thấy giao dịch',
  TRANSACTION_ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này với giao dịch',
  TRANSACTION_CREATE_DENIED: 'Bạn không có quyền tạo giao dịch cho ví này',
  TRANSACTION_UPDATE_DENIED: 'Bạn không có quyền cập nhật giao dịch này',
  TRANSACTION_DELETE_DENIED: 'Bạn không có quyền xóa giao dịch này',
  INVALID_TRANSACTION_TYPE: 'Loại giao dịch không hợp lệ. Chỉ chấp nhận income hoặc expense',

  // Category
  CATEGORY_NOT_FOUND: 'Không tìm thấy danh mục',
  CATEGORY_ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này với danh mục',
  CATEGORY_UPDATE_DENIED: 'Bạn không có quyền cập nhật danh mục này',
  CATEGORY_DELETE_DENIED: 'Bạn không có quyền xóa danh mục này',
  INVALID_CATEGORY_TYPE: 'Loại danh mục không hợp lệ. Chỉ chấp nhận income hoặc expense',

  // Budget
  BUDGET_NOT_FOUND: 'Không tìm thấy ngân sách',
  BUDGET_ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này với ngân sách',
  BUDGET_UPDATE_DENIED: 'Bạn không có quyền cập nhật ngân sách này',
  BUDGET_DELETE_DENIED: 'Bạn không có quyền xóa ngân sách này',
};
