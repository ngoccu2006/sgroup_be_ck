import express from "express";
import notificationController from "../controllers/notification.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware.authenticate);

// Xem danh sách thông báo của tôi
router.get("/", notificationController.getMyNotifications);

// Đánh dấu đã đọc thông báo
router.patch("/:id/read", notificationController.markAsRead);

export default router;