
import { Router } from "express";
import { submitCode , getSubmissionStatus ,runCode} from "../controllers/submission.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/submit").post(verifyJWT, submitCode);
router.route("/:submissionId").get(verifyJWT, getSubmissionStatus);
router.route("/run").post(verifyJWT, runCode);
export default router;