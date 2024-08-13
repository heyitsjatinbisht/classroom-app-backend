import { Classroom } from "../models/classroom.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Principal can create classrooms
const createClassroom = asyncHandler(async (req, res) => {
  const { name, startTime, endTime, days } = req.body;

  if (!name || !startTime || !endTime || !days || days.length === 0) {
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
const assignTeacherToClassroom = asyncHandler(async (req, res) => {
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
const assignStudentsToClassroom = asyncHandler(async (req, res) => {
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
const createTimetable = asyncHandler(async (req, res) => {
  const { classroomId, timetable } = req.body;

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

  // Validate each timetable entry
  timetable.forEach((period) => {
    // Check if period is within classroom hours
    if (
      period.startTime < classroom.startTime ||
      period.endTime > classroom.endTime ||
      !classroom.days.includes(period.day)
    ) {
      throw new ApiError(400, `Invalid timetable entry for ${period.subject}`);
    }

    // Check for overlapping periods
    classroom.timetable.forEach((existingPeriod) => {
      if (
        existingPeriod.day === period.day &&
        !(
          period.endTime <= existingPeriod.startTime ||
          period.startTime >= existingPeriod.endTime
        )
      ) {
        throw new ApiError(
          400,
          `Timetable entry for ${period.subject} overlaps with existing period ${existingPeriod.subject}`
        );
      }
    });
  });

  // Save the new timetable
  classroom.timetable.push(...timetable);
  await classroom.save();

  return res
    .status(200)
    .json(new ApiResponse(200, classroom, "Timetable created successfully"));
});

// Students can view their classroom details
const getClassroomDetails = asyncHandler(async (req, res) => {
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
const getClassrooms = asyncHandler(async (req, res) => {
  // Ensure that only principals can access this endpoint
  if (req.user.role !== "Principal") {
    throw new ApiError(403, "You are not authorized to view this information");
  }

  // Fetch all classrooms from the database
  const classrooms = await Classroom.find().populate(
    "teacher",
    "fullName email"
  );

  // Respond with the list of classrooms
  return res
    .status(200)
    .json(
      new ApiResponse(200, classrooms, "Classrooms retrieved successfully")
    );
});

// Get all students in a specific classroom
const getStudentsByClassroom = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;

  const classroom = await Classroom.findById(classroomId).populate(
    "students",
    "fullName email"
  );

  if (!classroom) {
    throw new ApiError(404, "Classroom not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        classroom.students,
        "Students retrieved successfully"
      )
    );
});

// Get timetable for a specific classroom
const getTimetable = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;

  const classroom = await Classroom.findById(classroomId);

  if (!classroom) {
    throw new ApiError(404, "Classroom not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        classroom.timetable,
        "Timetable retrieved successfully"
      )
    );
});

export {
  createClassroom,
  assignStudentsToClassroom,
  assignTeacherToClassroom,
  createTimetable,
  getClassroomDetails,
  getClassrooms,
  getStudentsByClassroom,
  getTimetable,
};
