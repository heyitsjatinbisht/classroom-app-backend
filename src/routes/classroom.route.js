import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import {
  createClassroom,
  getClassrooms,
  assignTeacherToClassroom,
  assignStudentToTeacher,
} from "../controllers/classroomController.js";

const router = express.Router();

// Routes for creating and managing classrooms
router.post("/", authenticate, authorizeRoles("Principal"), createClassroom);

router.get(
  "/",
  authenticate,
  authorizeRoles("Principal", "Teacher"),
  getClassrooms
);

router.post(
  "/assign-teacher",
  authenticate,
  authorizeRoles("Principal"),
  assignTeacherToClassroom
);

router.post(
  "/assign-student",
  authenticate,
  authorizeRoles("Principal", "Teacher"),
  assignStudentToTeacher
);

export default router;
