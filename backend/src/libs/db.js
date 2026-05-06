import mongoose from "mongoose";
import dotenv from "dotenv";

export const connectDB = async () => {
  dotenv.config();
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("Kết nối cơ sở dữ liệu thành công");
  } catch (error) {
    console.error("Lỗi khi kết nối cơ sở dữ liệu:", error);
    process.exit(1); // Exit the process with failure
  }
};
