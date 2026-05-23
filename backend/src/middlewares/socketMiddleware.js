import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Không tìm thấy access token"));
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
      if (err) {
        return next(new Error("Access token hết hạn hoặc không hợp lệ"));
      }

      const user = await User.findById(decodedUser.userId).select("-hashedPassword");
      if (!user) {
        return next(new Error("Người dùng không tồn tại"));
      }

      socket.user = user;
      next();
    });
  } catch (error) {
    console.error("Lỗi xác minh socket token:", error);
    next(new Error("Lỗi hệ thống"));
  }
};
