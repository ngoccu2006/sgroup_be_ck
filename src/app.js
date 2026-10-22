import express from "express";
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.route.js";
import classRouter from "./routes/class.route.js";
import classMemberRouter from "./routes/classMember.route.js"
import lessonRouter from "./routes/lesson.route.js";
import assignmentRouter from "./routes/assignment.route.js";
import errorHandler from "./middlewares/error.middleware.js";
import submissionRouter from "./routes/submission.route.js";
import analyticsRouter from "./routes/analytics.route.js";

const app = express();
app.use(express.json());

app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/classes", classRouter)
app.use("/class-members", classMemberRouter);
app.use("/lessons", lessonRouter);
app.use("/assignments", assignmentRouter);
app.use("/submissions", submissionRouter);
app.use("/analytics", analyticsRouter);

app.use(errorHandler);

export default app;