import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authrizeRoles.middleware.js";
import {
  registerUser,
  loginUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

const router = express.Router();

// Public routes
router.post("/login", loginUser);

// Protected routes
router.post(
  "/register",
  authenticate,
  authorizeRoles("Principal", "Teacher"),
  registerUser
);

router.get("/", authenticate, authorizeRoles("Principal", "Teacher"), getUsers);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("Principal", "Teacher"), // Principals and teachers can get user details
  getUser
);

// Update user
router.put(
  "/users/:id",
  authorizeRoles("Principal", "Teacher"), // Principal and Teacher can update users
  updateUser
);

// Delete user
router.delete(
  "/users/:id",
  authorizeRoles("Principal", "Teacher"), // Principal and Teacher can delete users
  deleteUser
);

export default router;
