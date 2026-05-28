import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m"; // thường là dưới 15p
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //14 ngày
const isProduction = process.env.NODE_ENV === "production";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction, // chỉ gửi cookie qua HTTPS ở production
  sameSite: isProduction ? "none" : "lax", // ở local dùng 'lax', production dùng 'none'
};

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "Không thể thiếu username, password, email, firstName và lastName",
      });
    }

    //kiểm tra username
    const duplicateUser = await User.findOne({ username });

    if (duplicateUser) {
      return res.status(409).json({ message: "Username đã tồn tại" });
    }

    //mã hóa password
    const hashedPassword = await bcrypt.hash(password, 10); //saltRounds = 10

    //tạo user mới và lưu vào database
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${lastName} ${firstName}`,
    });

    //reurn response
    return res.sendStatus(204); //204 No Content
  } catch (error) {
    console.error("Lỗi khi gọi signUp:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signIn = async (req, res) => {
  try {
    //lấy input
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Thiếu username hoặc password" });
    }

    //lấy hashpassword từ database để so sánh với password input
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    //kiểm tra password
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "username hoặc password không chính xác" });
    }

    //nếu khớp, tạo access token với JWT

    const accessToken = jwt.sign(
      {
        userId: user._id,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    //tạo refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    //tạo session mới để lưu refresh token
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    // trả refresh token về trong cookie
    res.cookie("refreshToken", refreshToken, {
      ...REFRESH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_TTL,
    });

    //trả access token về trong response body
    return res.status(200).json({
      message: `User ${user.displayName} đã đăng nhập thành công`,
      accessToken,
    });
  } catch (error) {
    console.error("Lỗi khi gọi signIn:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const signOut = async (req, res) => {
  try {
    //lấy refresh token từ cookie
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      //xóa session tương ứng với refresh token
      await Session.findOneAndDelete({ refreshToken });

      //xóa cookie refresh token
      res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
    }

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signOut:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

//tạo access token mới từ refresh token
export const refreshToken = async (req, res) => {
  try {
    //lấy refresh token từ cookie
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Token không tồn tại" });
    }

    //so với refresh token trong database

    const session = await Session.findOne({ refreshToken: refreshToken });

    if (!session) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    //kiểm tra refresh token hết hạn hay chưa
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token đã hết hạn" });
    }

    //tạo access token mới và trả về cho client
    const accessToken = jwt.sign(
      {
        userId: session.userId,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refreshToken:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
