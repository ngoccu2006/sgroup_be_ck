import express from 'express';
import lessonController from '../controllers/lesson.controller.js';
import lessonProgressController from '../controllers/lessonProgress.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// API tạo bài học: Bắt buộc đăng nhập
router.post("/", authMiddleware.authenticate, authMiddleware.authorizeAdmin, lessonController.createLesson);

// API lấy danh sách bài học của một lớp học: Yêu cầu đăng nhập để học
router.get("/class/:classId", authMiddleware.authenticate, lessonController.getLessonsByClass);

// danh dau hoan thanh bai hoc
router.post("/:lessonId/complete", authMiddleware.authenticate, lessonProgressController.completeLesson);
export default router;
