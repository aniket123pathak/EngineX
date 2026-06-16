// src/middlewares/admin.middleware.js
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * WORKFLOW: THE ADMIN BOUNCER
 * 1. This middleware MUST run after `verifyJWT`.
 * 2. Because `verifyJWT` runs first, it already fetches the user and attaches it to `req.user`.
 * 3. We simply check if the attached user has the "ADMIN" role.
 * 4. If yes, proceed to the controller. If no, throw a 403 Forbidden error.
 */
export const isAdmin = asyncHandler(async (req, res, next) => {
    // Safety check: Ensure req.user actually exists (meaning verifyJWT did its job)
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request: User context missing");
    }

    // Check the role
    if (req.user.role !== "ADMIN") {
        throw new ApiError(403, "Forbidden: You do not have administrator privileges to perform this action");
    }

    // User is an Admin, let them pass
    next();
});