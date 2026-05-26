import express from "express";

import {
  createConversation,
  getConversations,
  getMessages,
  markAsSeen,
  clearConversation,
  leaveGroup,
  disbandGroup,
  addGroupMembers,
  updateGroupName,
  uploadGroupAvatar,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markAsSeen);
router.patch("/:conversationId/members", addGroupMembers);
router.patch("/:conversationId/leave", leaveGroup);
router.patch("/:conversationId/name", updateGroupName);
router.patch("/:conversationId/avatar", upload.single("file"), uploadGroupAvatar);
router.delete("/:conversationId/clear", clearConversation);
router.delete("/:conversationId/disband", disbandGroup);

export default router;
