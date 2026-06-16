import { Router } from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// SECURE ROUTE: You must pass the verifyJWT check before you can logout
router.route("/logout").post(verifyJWT, logoutUser); 

export default router;