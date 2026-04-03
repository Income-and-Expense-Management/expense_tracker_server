class ResponseUtils {
  success(res, data, message = 'Thành công', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  error(res, message = 'Có lỗi xảy ra', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  created(res, data, message = 'Tạo mới thành công') {
    return this.success(res, data, message, 201);
  }

  badRequest(res, message = 'Dữ liệu không hợp lệ', errors = null) {
    return this.error(res, message, 400, errors);
  }

  unauthorized(res, message = 'Không có quyền truy cập') {
    return this.error(res, message, 401);
  }

  forbidden(res, message = 'Truy cập bị từ chối') {
    return this.error(res, message, 403);
  }

  notFound(res, message = 'Không tìm thấy') {
    return this.error(res, message, 404);
  }

  conflict(res, message = 'Dữ liệu bị trùng lặp') {
    return this.error(res, message, 409);
  }
}

module.exports = new ResponseUtils();
