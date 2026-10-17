function errorHandler(err, req, res, next) {
  if (err.code === "23505") {
    return res.status(400).json({
      message: "Tài nguyên đã tồn tại hoặc bị trùng lặp dữ liệu!",
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: err.message || "Lỗi hệ thống nội bộ!",
  });
}

export default errorHandler;