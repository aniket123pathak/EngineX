
import { Router } from "express";
import { createProblem, getAllProblems, getProblemById ,deleteProblem} from "../controllers/problem.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
const router = Router();
router.route("/").get(getAllProblems);
router.route("/:id").get(getProblemById);
router.route("/:id")
    .get(getProblemById)
    .delete(verifyJWT, deleteProblem);
router.route("/create").post(verifyJWT, createProblem);
export default router;