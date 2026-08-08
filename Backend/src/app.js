import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN === "*" ? "*" : process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});
import userRouter from "./routes/user.route.js";
import problemRouter from "./routes/problem.route.js";
import submissionRouter from "./routes/submission.route.js";
import contestRouter from "./routes/contest.route.js";
app.use("/api/v1/users", userRouter);
app.use("/api/v1/problems", problemRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/contests", contestRouter);
export { app };