import express from "express";
import analyticsController from "../controllers/analytics.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware.authenticate);

// 1. Thống kê số lượng/tỷ lệ nộp bài tập trong lớp (Cho Mentor/Admin)
router.get(
  "/class/:classId/assignments-summary",
  authMiddleware.authorizeMentorOrAdmin,
  analyticsController.getAssignmentsSummary
);

// 2. Thống kê GPA của từng Member trong lớp (Cho Mentor/Admin)
router.get(
  "/class/:classId/members-gpa",
  authMiddleware.authorizeMentorOrAdmin,
  analyticsController.getMembersGpa
);

// 3. Xuất file Excel bảng điểm tổng hợp (Cho Mentor/Admin)
router.get(
  "/class/:classId/export-excel",
  authMiddleware.authorizeMentorOrAdmin,
  analyticsController.exportClassGradesExcel
);

export default router;