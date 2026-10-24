import express from "express";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.route.js";
import classRouter from "./routes/class.route.js";
import classMemberRouter from "./routes/classMember.route.js"
import lessonRouter from "./routes/lesson.route.js";
import assignmentRouter from "./routes/assignment.route.js";
import errorHandler from "./middlewares/error.middleware.js";
import submissionRouter from "./routes/submission.route.js";
import analyticsRouter from "./routes/analytics.route.js";
import notificationRouter from "./routes/notification.route.js";

const app = express();
app.use(express.json());

//FE fetch

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
  exposedHeaders: ["Content-Disposition"], // Giúp FE đọc được tên file Excel khi tải về
}));

app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/classes", classRouter)
app.use("/class-members", classMemberRouter);
app.use("/lessons", lessonRouter);
app.use("/assignments", assignmentRouter);
app.use("/submissions", submissionRouter);
app.use("/analytics", analyticsRouter);
app.use("/notifications", notificationRouter);

// Cho phép truy cập file tĩnh trong thư mục src/public
app.use(express.static('src/public'));

app.use(errorHandler);

export default app;