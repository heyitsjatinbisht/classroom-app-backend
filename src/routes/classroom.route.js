import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authrizeRoles.middleware.js";
import {
  createClassroom,
  assignStudentsToClassroom,
  assignTeacherToClassroom,
  createTimetable,
  getClassroomDetails,
  getClassrooms,
  getStudentsByClassroom,
  getTimetable,
} from "../controllers/classroom.controller.js";

const router = express.Router();

// Create a new classroom (Principal only)
router.post("/", authenticate, authorizeRoles("Principal"), createClassroom);

// Assign a teacher to a classroom (Principal only)
router.post(
  "/assign-teacher",
  authenticate,
  authorizeRoles("Principal"),
  assignTeacherToClassroom
);

// Assign students to a classroom (Principal or Teacher)
router.post(
  "/assign-students",
  authenticate,
  authorizeRoles("Principal", "Teacher"),
  assignStudentsToClassroom
);

// Create a timetable entry for a classroom (Teacher only)
router.post(
  "/:classroomId/timetables",
  authenticate,
  authorizeRoles("Teacher"),
  createTimetable
);

// Get all classrooms (Principal only)
router.get("/", authenticate, authorizeRoles("Principal"), getClassrooms);

// Student routes
router.get(
  "/:classroomId/students",
  authenticate,
  authorizeRoles("Student"),
  getStudentsByClassroom
);
router.get(
  "/:classroomId/timetable",
  authenticate,
  authorizeRoles("Student"),
  getTimetable
);
router.get(
  "/classroom-details",
  authenticate,
  authorizeRoles("Student"),
  getClassroomDetails
);

export default router;
