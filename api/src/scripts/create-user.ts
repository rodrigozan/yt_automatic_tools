import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

async function createUser() {
  try {
    await mongoose.connect(process.env.DB_URI as string);
    console.log("Database connected");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    const User = mongoose.model("User", new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String },
      name: { type: String },
      channels: { type: Array, default: [] },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }));

    const existingUser = await User.findOne({ email: "rodzandonadi@gmail.com" });
    if (existingUser) {
      console.log("User already exists");
      await mongoose.disconnect();
      return;
    }

    const user = await User.create({
      email: "rodzandonadi@gmail.com",
      password: hashedPassword,
      name: "Rodzandonadi",
    });

    console.log("User created:", user);
    await mongoose.disconnect();
    console.log("Database disconnected");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createUser();