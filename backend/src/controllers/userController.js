import User from "../models/User.js";


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
};