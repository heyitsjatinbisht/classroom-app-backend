import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";
import mongoose from "mongoose";
import { User } from "./models/user.model.js";
import { DB_NAME } from "./constants.js";

dotenv.config();

const createPrincipalAccount = async () => {
  try {
    const principalEmail = "principal@classroom.com";
    const principalPassword = "Admin";

    // Connect to MongoDB (in case it's not connected)
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    // Check if the principal account already exists
    const existingPrincipal = await User.findOne({ email: principalEmail });

    if (!existingPrincipal) {
      // Create the principal account
      await User.create({
        fullName: "Principal",
        email: principalEmail,
        password: principalPassword, // Password will be hashed by the model's pre-save hook
        role: "Principal",
      });

      console.log("Principal account created successfully.");
    } else {
      console.log("Principal account already exists.");
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error creating principal account:", error);
    process.exit(1);
  }
};

// Connect to the database and start the server
connectDB()
  .then(async () => {
    // Initialize the principal account
    await createPrincipalAccount();

    // Start the server
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => console.log("Mongodb connection failed!!!", err));
