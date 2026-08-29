import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import { seedIfEmpty } from "./seed.js";

await connectDB(process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/smart_student_portal");
await seedIfEmpty(true);
await mongoose.disconnect();
console.log("Seed complete");