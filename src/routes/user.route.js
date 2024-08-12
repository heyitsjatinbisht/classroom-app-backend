import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import {
  registerUser,
  loginUser,
  getUsers,
} from "../controllers/userController.js";

const router = express.Router();

// Public routes
router.post("/login", loginUser);

// Protected routes
router.post(
  "/register",
  authenticate,
  authorizeRoles("Principal", "Teacher"), // Only principals and teachers can register new users
  registerUser
);

router.get("/", authenticate, authorizeRoles("Principal"), getUsers);

export default router;
