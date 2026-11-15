import express from "express";
import scheduleController from "../controllers/schedule.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validateSchedule.middleware.js"

const router = express.Router();

router.use(authMiddleware.authenticate);

// Xem lịch của 1 lớp
router.get("/class/:classId", scheduleController.getSchedulesByClass);

// Mentor/Admin tạo, sửa, xoá
router.post("/class/:classId", authMiddleware.authorizeMentorOrAdmin, validate.validateCreateSchedule, scheduleController.createSchedule);
router.patch("/:id", authMiddleware.authorizeMentorOrAdmin, validate.validateUpdateSchedule, scheduleController.updateSchedule);
router.delete("/:id", authMiddleware.authorizeMentorOrAdmin, scheduleController.deleteSchedule);

export default router;
