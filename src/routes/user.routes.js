import express from 'express';
import userController from '../controllers/user.controller.js';
const router = express.Router();

router.get("/", userController.getAllUsers);         // Lấy tất cả user
router.get("/:id", userController.getUserById);     // Lấy chi tiết user bằng ID
router.post("/", userController.createUser);         // Tạo mới user
router.put("/:id", userController.updateUser);       // Cập nhật user theo ID
router.delete("/:id", userController.deleteUser);    // Xóa user theo ID

export default router;
