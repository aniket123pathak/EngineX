// src/routes/problem.route.js
import { Router } from "express";
import { createProblem, getAllProblems, getProblemById ,deleteProblem} from "../controllers/problem.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

/**
 * WORKFLOW: PROBLEM ROUTING
 * - Viewing problems: Anyone can view the list of problems (Unprotected route).
 * - Creating problems: Must be logged in AND must be an Admin.
 */

// --- PUBLIC ROUTES ---
// Anyone can view the problem list and individual problems
router.route("/").get(getAllProblems);
router.route("/:id").get(getProblemById);
router.route("/:id")
    .get(getProblemById)
    .delete(verifyJWT, deleteProblem);
// --- PROTECTED ADMIN ROUTES ---
// 1. verifyJWT checks if they have a valid token (Are they logged in?)
// 2. isAdmin checks if req.user.role === "ADMIN" (Are they staff?)
// 3. createProblem actually saves the data.
router.route("/create").post(verifyJWT, isAdmin, createProblem);

export default router;