import express from "express";
import classController from "../controllers/class.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import lessonProgressController from "../controllers/lessonProgress.controller.js";

const router = express.Router();

router.get("/", classController.getAllClasses);

router.post("/", authMiddleware.authenticate, authMiddleware.authorizeAdmin, classController.createClass);

// xem tien do hoc tap cua 1 member trong 1 class
router.get("/:classId/progress", authMiddleware.authenticate, lessonProgressController.getClassProgress);

export default router;