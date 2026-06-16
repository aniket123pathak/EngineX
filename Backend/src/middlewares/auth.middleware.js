// src/middlewares/auth.middleware.js
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

/**
 * WORKFLOW: THE BOUNCER (Auth Middleware)
 * 1. Look for the token in the user's Cookies OR the Authorization Header.
 * 2. If no token, kick them out (401).
 * 3. Verify the token using our Secret Key. If fake/expired, kick them out.
 * 4. Find the user in the database using the ID hidden inside the token.
 * 5. Attach the user object to the `req` object, so the next function can use it!
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // 1. Get the token from cookies or the bearer header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request: No token found");
        }

        // 2. Verify token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // 3. Fetch user
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        // 4. Attach user to request and move to the next function
        req.user = user;
        next();
        
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});