// src/routes/submission.route.js
import { Router } from "express";
import { submitCode , getSubmissionStatus} from "../controllers/submission.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect this route: Only logged-in users can submit code
router.route("/submit").post(verifyJWT, submitCode);

router.route("/:submissionId").get(verifyJWT, getSubmissionStatus);

export default router;