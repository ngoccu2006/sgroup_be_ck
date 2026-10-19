import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Cho phép các định dạng file phổ biến cho bài nộp
  const allowedTypes = [
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Định dạng file không hỗ trợ! (Chỉ chấp nhận PDF, ZIP, DOCX, PNG, JPG)");
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
  },
  fileFilter,
});

export default upload;