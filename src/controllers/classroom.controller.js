import { Classroom } from "../models/classroom.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Principal can create classrooms
export const createClassroom = asyncHandler(async (req, res) => {
  const { name, startTime, endTime, days } = req.body;

  if (!name || !startTime || !endTime || !days) {
    throw new ApiError(400, "All fields are required");
  }

  const classroom = await Classroom.create({
    name,
    startTime,
    endTime,
    days,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, classroom, "Classroom created successfully"));
});

// Principal can assign teachers to classrooms
export const assignTeacherToClassroom = asyncHandler(async (req, res) => {
  const { teacherId, classroomId } = req.body;

  const teacher = await User.findById(teacherId);
  const classroom = await Classroom.findById(classroomId);

  if (!teacher || teacher.role !== "Teacher") {
    throw new ApiError(404, "Teacher not found");
  }

  if (!classroom) {
    throw new ApiError(404, "Classroom not found");
  }

  // Ensure the teacher is not already assigned to another classroom
  if (teacher.assignedClassroom) {
    throw new ApiError(400, "This teacher is already assigned to a classroom");
  }

  // Assign the classroom to the teacher
  teacher.assignedClassroom = classroom._id;
  await teacher.save();

  // Assign the teacher to the classroom
  classroom.teacher = teacher._id;
  await classroom.save();

  return res
    .status(200)
    .json(new ApiResponse(200, teacher, "Teacher assigned to classroom"));
});

// Principal or Teacher can assign students to classrooms
export const assignStudentsToClassroom = asyncHandler(async (req, res) => {
  const { studentIds, classroomId } = req.body;

  const classroom = await Classroom.findById(classroomId);

  if (!classroom) {
    throw new ApiError(404, "Classroom not found");
  }

  // Find all students
  const students = await User.find({
    _id: { $in: studentIds },
    role: "Student",
  });

  // Assign the classroom to each student and add the student to the classroom's student list
  const updatedStudents = await Promise.all(
    students.map(async (student) => {
      student.assignedClassroom = classroom._id;
      await student.save();

      classroom.students.push(student._id);
      return student;
    })
  );

  await classroom.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedStudents, "Students assigned to classroom")
    );
});

// Teacher can create a timetable for their classroom
export const createTimetable = asyncHandler(async (req, res) => {
  const { classroomId, timetable } = req.body; // Timetable is an array of periods

  const classroom = await Classroom.findById(classroomId);

  if (!classroom) {
    throw new ApiError(404, "Classroom not found");
  }

  // Check if the teacher is assigned to this classroom
  if (
    req.user.role !== "Teacher" ||
    !req.user.assignedClassroom.equals(classroomId)
  ) {
    throw new ApiError(
      403,
      "You are not authorized to create a timetable for this classroom"
    );
  }

  // Ensure periods do not overlap and fall within the classroom's start and end times
  for (let period of timetable) {
    if (
      period.startTime < classroom.startTime ||
      period.endTime > classroom.endTime
    ) {
      throw new ApiError(400, "Period time is outside of classroom hours");
    }
    // Additional checks for overlapping periods can be implemented here
  }

  // Save the timetable
  classroom.timetable = timetable;
  await classroom.save();

  return res
    .status(200)
    .json(new ApiResponse(200, classroom, "Timetable created successfully"));
});

// Students can view their classroom details
export const getClassroomDetails = asyncHandler(async (req, res) => {
  if (req.user.role !== "Student") {
    throw new ApiError(403, "You are not authorized to view this information");
  }

  const classroom = await Classroom.findById(req.user.assignedClassroom)
    .populate("students", "fullName email")
    .populate("teacher", "fullName email");

  if (!classroom) {
    throw new ApiError(404, "Classroom not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        classroom,
        "Classroom details retrieved successfully"
      )
    );
});
