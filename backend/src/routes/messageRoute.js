import express from "express";

import {
  sendDirectMessage,
  sendGroupMessage,
  recallMessage,
  uploadMessageImage,
  reactToMessage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Upload hình ảnh tin nhắn
router.post("/upload", upload.single("file"), uploadMessageImage);

// Gửi tin nhắn trực tiếp
router.post("/direct", checkFriendship, sendDirectMessage);

router.post("/group", checkGroupMembership, sendGroupMessage);

// Thu hồi tin nhắn
router.delete("/:messageId", recallMessage);

// Thả cảm xúc tin nhắn
router.post("/:messageId/react", reactToMessage);

export default router;
