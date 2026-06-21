// src/routes/submission.route.js
import { Router } from "express";
import { submitCode } from "../controllers/submission.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect this route: Only logged-in users can submit code
router.route("/submit").post(verifyJWT, submitCode);

export default router;