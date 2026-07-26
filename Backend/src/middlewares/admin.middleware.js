
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const isAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request: User context missing");
    }
    if (req.user.role !== "ADMIN") {
        throw new ApiError(403, "Forbidden: You do not have administrator privileges to perform this action");
    }
    next();
});