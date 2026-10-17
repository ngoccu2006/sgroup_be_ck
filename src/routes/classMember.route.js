
import express from "express";

import classMemberController from "../controllers/classMember.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/add", authMiddleware.authenticate, authMiddleware.authorizeAdmin, classMemberController.addMemberToClass);

router.get("/:classId/members", authMiddleware.authenticate, classMemberController.getMembersInClass);

export default router;