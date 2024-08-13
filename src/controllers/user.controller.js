import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, role, password, assignedClassroom } = req.body;

  if ([fullName, email, role, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  if (!["Teacher", "Student"].includes(role)) {
    throw new ApiError(400, "Invalid role specified");
  }

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role,
    assignedClassroom,
  });

  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while registered successfully"
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!(email || password)) {
    throw new ApiError(400, "email or password is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect Password");
  }

  const loggedInUser = await User.findById(user._id).select("-password");

  const accessToken = jwt.sign(
    { id: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "User logged in successfully"
      )
    );
});

// logout

// Get all users (for Principal)
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, users, "Users retrieved successfully"));
});

// Get a single user by ID
const getUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, user, "User retrieved successfully"));
});
// Update user details
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, email, role, assignedClassroom } = req.body;

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Only allow updating role if the user is a Principal
  if (req.user.role !== "Principal" && req.user.role === "Teacher" && role) {
    throw new ApiError(403, "Teachers cannot change roles");
  }

  user.fullName = fullName || user.fullName;
  user.email = email || user.email;
  user.role = role || user.role;
  user.assignedClassroom = assignedClassroom || user.assignedClassroom;

  await user.save();

  res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Only allow deletion if the user is a Principal or the user is a Student being deleted by a Teacher
  if (
    req.user.role !== "Principal" &&
    req.user.role === "Teacher" &&
    user.role === "Student"
  ) {
    throw new ApiError(403, "You do not have permission to delete this user");
  }

  await user.remove();

  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

export { registerUser, loginUser, getUsers, getUser, updateUser, deleteUser };
