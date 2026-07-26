import { Router } from "express";
import { registerUser, loginUser, logoutUser, getUserProfile } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser); 
router.route("/profile").get(verifyJWT, getUserProfile);
export default router;