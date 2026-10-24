import express from 'express';
import userController from '../controllers/user.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
const router = express.Router();

router.use(authMiddleware.authenticate)

router.get("/", authMiddleware.authorizeAdmin, userController.getAllUsers);         // Lấy tất cả user
router.get("/:id", authMiddleware.authorizeAdmin, userController.getUserById);     // Lấy chi tiết user bằng ID
router.post("/", authMiddleware.authorizeAdmin, userController.createUser);         // Tạo mới user
router.put("/:id", authMiddleware.authorizeAdmin, userController.updateUser);       // Cập nhật user theo ID
router.delete("/:id", authMiddleware.authorizeAdmin, userController.deleteUser);    // Xóa user theo ID

export default router;
