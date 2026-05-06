import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = async (req, res, next) => {
  try {
    //lấy access token từ header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy access token" });
    }

    //xác nhận token có hợp lệ không
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      async (err, decodedUser) => {
        if (err) {
          return res
            .status(403)
            .json({ message: "Access token hết hạn hoặc không hợp lệ" });
        }
        //tim user tương ứng với token
        const user = await User.findById(decodedUser.userId).select(
          "-hashedPassword",
        );
        if (!user) {
          return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        //gắn thông tin user vào req để controller có thể sử dụng
        req.user = user; // Gắn thông tin user vào req để controller có thể sử dụng
        next();
      },
    );
  } catch (error) {
    console.error("Lỗi xác minh JWT trong authMiddleware:", error);
    return res.status(500).json({ message: "lỗi hệ thống" });
  }
};
