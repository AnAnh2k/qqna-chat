import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String, //link CDN hiển thị ảnh đại diện
    },
    avatarId: {
      type: String, //id ảnh đại diện trên CDN
    },
    bio: {
      type: String,
      maxlength: 500, //tùy
    },
    phone: {
      type: String,
      sparse: true, // cho phép null và yêu cầu duy nhất
    },
  },
  {
    timestamps: true, //tự động tạo createdAt và updatedAt
  },
);

const User = mongoose.model("User", userSchema);
export default User;
