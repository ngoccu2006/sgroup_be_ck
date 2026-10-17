import express from "express";
import assignmentController from "../controllers/assignment.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authMiddleware.authenticate); // Xác thực người dùng

// Mentor/Admin tạo bài tập
router.post("/", authMiddleware.authorizeMentorOrAdmin, assignmentController.createAssignment);

// Xem danh sách bài tập theo lớp
router.get("/class/:classId", assignmentController.getAssignmentsByClass);

// Xem chi tiết bài tập theo ID
router.get("/:id", assignmentController.getAssignmentById);

// Mentor/Admin sửa/xóa bài tập
router.put("/:id", authMiddleware.authorizeMentorOrAdmin, assignmentController.updateAssignment);
router.delete("/:id", authMiddleware.authorizeMentorOrAdmin, assignmentController.deleteAssignment);

export default router;