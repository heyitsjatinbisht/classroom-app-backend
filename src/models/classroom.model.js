import mongoose, { Schema } from "mongoose";

const classroomSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  days: [{ type: String, required: true }],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const Classroom = mongoose.model("Classroom", classroomSchema);
