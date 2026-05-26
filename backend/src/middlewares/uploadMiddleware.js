import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
});

export const uploadImageFromBuffer = (buffer, options) => {
  const transformation =
    options?.transformation ?? [
      { width: 1024, height: 1024, crop: "limit", quality: "auto:best" },
    ];

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "qqna_chat/avatars",
        resource_type: "image",
        transformation,
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};
