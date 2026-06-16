import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// 1. Secure CORS configurations
app.use(cors({
    origin: process.env.CORS_ORIGIN === "*" ? "*" : process.env.CORS_ORIGIN,
    credentials: true
}));

// 2. Strict rate/size constraint defenses against DOS payloads
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// 3. Cookie infrastructure
app.use(cookieParser());

// Health check endpoint for automated orchestrators/monitors
app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

export { app };