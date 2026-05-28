import dotenv from "dotenv";
import { connect } from "mongoose";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import cors from "cors";
import friendRoute from "./routes/friendRoute.js";
import messageRoute from "./routes/messageRoute.js";
import conversationRoute from "./routes/conversationRoute.js";
import express from "express";
import { app, server, io } from "./socket/index.js";
import { v2 as cloudinary } from 'cloudinary';
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = JSON.parse(
  fs.readFileSync(path.join(__dirname, "swagger.json"), "utf8")
);

dotenv.config();

const PORT = process.env.PORT || 5001;

//middleware
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [process.env.CLIENT_URL];
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (như postman, curl), localhost hoặc IP mạng nội bộ
      if (
        !origin ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.") ||
        origin.startsWith("http://172.") ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS"));
      }
    },
    credentials: true, // Cho phép gửi cookie
  }),
);

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//public routes
app.get("/api/ping", (req, res) => {
  res.status(200).json({ message: "pong" });
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth", authRoute);

//private routes
app.use(protectedRoute); // áp dụng middleware bảo vệ cho tất cả các route sau nó
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/messages", messageRoute);
app.use("/api/conversations", conversationRoute);

connectDB().then(() => {
  const activeServer = server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}: http://localhost:${PORT}`);
  });

  // Graceful shutdown cho Nodemon restart (SIGUSR2)
  process.once("SIGUSR2", () => {
    io.close();
    activeServer.close();
    console.log("Đã giải phóng cổng 5001 (SIGUSR2)");
    process.kill(process.pid, "SIGUSR2");
  });

  // Graceful shutdown khi nhấn Ctrl + C (SIGINT)
  process.on("SIGINT", () => {
    io.close();
    activeServer.close();
    console.log("Đã giải phóng cổng 5001 (SIGINT)");
    process.exit(0);
  });

  // Graceful shutdown khi tắt tiến trình (SIGTERM)
  process.on("SIGTERM", () => {
    io.close();
    activeServer.close();
    console.log("Đã giải phóng cổng 5001 (SIGTERM)");
    process.exit(0);
  });
});
// restarted!
