import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["Principal", "Teacher", "Student"],
      required: true,
    },
    assighnedClassroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
