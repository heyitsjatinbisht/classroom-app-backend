import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { ApiError } from "./utils/ApiError.js";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

//routes import

import userRouter from "./routes/user.route.js";
import classroomRouter from "./routes/classroom.route.js";

//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/classroom", classroomRouter);

// Error-handling middleware
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      data: err.data,
    });
  }

  // Fallback for unhandled errors
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [],
  });
});

export { app };
