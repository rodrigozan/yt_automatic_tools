import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";

dotenv.config();

const MASTER_EMAIL = "admin_dev@yt_automatic_tools.com";
const MASTER_PASSWORD = "123";

async function createMasterUser() {
  try {
    await mongoose.connect(process.env.DB_URI as string);
    console.log("Database connected");

    const hashedPassword = await bcrypt.hash(MASTER_PASSWORD, 10);

    const existingUser = await User.findOne({ email: MASTER_EMAIL });
    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.role = "admin";
      existingUser.updatedAt = new Date();
      await existingUser.save();
      console.log("Master user already existed, updated to admin role:", existingUser.email);
    } else {
      const user = await User.create({
        email: MASTER_EMAIL,
        password: hashedPassword,
        name: "Admin Master",
        role: "admin",
      });
      console.log("Master user created:", user.email);
    }

    await mongoose.disconnect();
    console.log("Database disconnected");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createMasterUser();
