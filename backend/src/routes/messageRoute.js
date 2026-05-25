import express from "express";

import {
  sendDirectMessage,
  sendGroupMessage,
  recallMessage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";

const router = express.Router();

// Gửi tin nhắn trực tiếp
router.post("/direct", checkFriendship, sendDirectMessage);

router.post("/group", checkGroupMembership, sendGroupMessage);

// Thu hồi tin nhắn
router.delete("/:messageId", recallMessage);

export default router;
