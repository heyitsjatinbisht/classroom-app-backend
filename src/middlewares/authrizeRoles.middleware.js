import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Middleware to check for required roles
export const authorizeRoles = (...allowedRoles) => {
  return asyncHandler((req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action"
      );
    }
    next();
  });
};
