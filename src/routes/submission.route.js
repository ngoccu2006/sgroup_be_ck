import express from "express";
import submissionController from "../controllers/submission.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware.authenticate);

// Member nộp bài / cập nhật bài nộp
router.post("/", submissionController.submitAssignment);

// Member xem lại bài nộp của chính mình
router.get("/my-submission/:assignmentId", submissionController.getMySubmission);

// Mentor/Admin xem tất cả danh sách bài nộp của 1 assignment
router.get("/assignment/:assignmentId", authMiddleware.authorizeMentorOrAdmin, submissionController.getSubmissionsByAssignment);

// Mentor/Admin chấm điểm & feedback
router.put("/:id/grade", authMiddleware.authorizeMentorOrAdmin, submissionController.gradeSubmission);

export default router;