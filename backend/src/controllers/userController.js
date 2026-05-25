import User from "../models/User.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";


export const authMe = async (req, res) => {
  try {
    //req.user đã được gắn trong middleware protectedRoute
    const user = req.user;
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi trong authMe controller:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Cần cung cấp username trong query." });
    }

    const user = await User.findOne({ username }).select(
      "_id displayName username avatarUrl"
    );

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi xảy ra khi searchUserByUsername", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
}

export const uploadAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl: result.secure_url,
        avatarId: result.public_id,
      },
      {
        returnDocument: "after",
      }
    ).select("avatarUrl");

    if (!updatedUser.avatarUrl) {
      return res.status(400).json({ message: "Avatar trả về null" });
    }

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload avatar", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const updateMe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, username, email, phone, bio } = req.body;

    const updates = {};

    if (displayName !== undefined) {
      if (!displayName.trim()) {
        return res.status(400).json({ message: "Họ và tên không được để trống" });
      }
      updates.displayName = displayName.trim();
    }

    if (username !== undefined) {
      if (!username.trim()) {
        return res.status(400).json({ message: "Tên người dùng không được để trống" });
      }
      const normalizedUsername = username.trim().toLowerCase();
      const duplicateUsername = await User.findOne({
        _id: { $ne: userId },
        username: normalizedUsername,
      });
      if (duplicateUsername) {
        return res.status(409).json({ message: "Tên người dùng đã tồn tại" });
      }
      updates.username = normalizedUsername;
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({ message: "Email không được để trống" });
      }
      const normalizedEmail = email.trim().toLowerCase();
      const duplicateEmail = await User.findOne({
        _id: { $ne: userId },
        email: normalizedEmail,
      });
      if (duplicateEmail) {
        return res.status(409).json({ message: "Email đã tồn tại" });
      }
      updates.email = normalizedEmail;
    }

    if (phone !== undefined) {
      updates.phone = phone.trim();
    }

    if (bio !== undefined) {
      updates.bio = bio.trim();
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      returnDocument: "after",
      runValidators: true,
    }).select("-hashedPassword");

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi xảy ra khi cập nhật thông tin cá nhân", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select(
      "_id displayName username avatarUrl bio email phone"
    );

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy thông tin người dùng", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
