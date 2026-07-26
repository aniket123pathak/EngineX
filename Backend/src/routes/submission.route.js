
import { Router } from "express";
import { submitCode , getSubmissionStatus} from "../controllers/submission.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/submit").post(verifyJWT, submitCode);
router.route("/:submissionId").get(verifyJWT, getSubmissionStatus);
export default router;