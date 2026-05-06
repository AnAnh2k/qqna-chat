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
