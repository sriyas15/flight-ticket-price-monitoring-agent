import mongoose from "mongoose";
import env from "./env.js";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      dbName: "flight-deal-agent",
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });
  } catch (err) {
    logger.error("MongoDB initial connection failed:", err);
    process.exit(1);
  }
};

export default connectDB;
