import dns from "dns";
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { connectDB } from "./db.js";
import { seedIfEmpty } from "./seed.js";

import authRoutes from "./routes/auth.js";
import stateRoutes from "./routes/state.js";
import adminRoutes, { UPLOAD_DIR } from "./routes/admin.js";

// DNS configuration for MongoDB Atlas
dns.setServers(["8.8.8.8"]);

const app = express();

const PORT = Number(process.env.PORT ?? 5000);

/* ------------------------------- middleware ------------------------------ */

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? true,
  })
);

app.use(
  express.json({
    limit: "25mb",
  })
);

app.use(morgan("dev"));

/* -------------------------------- health -------------------------------- */

app.get("/", (_req, res) => {
  res.json({
    message: "Smart Student Portal API is running",
    status: "ok",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

/* -------------------------------- uploads ------------------------------- */

app.use(
  "/uploads",
  express.static(UPLOAD_DIR)
);

/* -------------------------------- routes -------------------------------- */

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/state",
  stateRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

/* ------------------------------- 404 guard ------------------------------ */

app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

/* ----------------------------- error handler ---------------------------- */

app.use((err, _req, res, _next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    message: err.message ?? "Internal server error",
  });
});

/* ----------------------------- database --------------------------------- */

try {
  await connectDB(
    process.env.MONGO_URI ??
      "mongodb://127.0.0.1:27017/smart_student_portal"
  );

  console.log("MongoDB connected");

  await seedIfEmpty();

  console.log("Seed check completed");
} catch (error) {
  console.error("MongoDB connection/seed failed:");
  console.error(error);
}

/* ------------------------------- local ---------------------------------- */

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(
      `API running on http://localhost:${PORT}`
    );
  });
}

/* ------------------------------- export --------------------------------- */

export default app;