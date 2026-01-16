import mongoose from "mongoose";

import dotenv from "dotenv";

dotenv.config()

export class Connection {
    static async connect() {
        try {
            await mongoose.connect(process.env.DB_URI as string);
            console.log("Database connected");
        } catch (error) {
            console.error("Database connection error", error);
        }
    }

    static async disconnect() {
        try {
            await mongoose.disconnect();
            console.log("Database disconnected");
        } catch (error) {
            console.error("Database disconnection error", error);
        }
    }
}