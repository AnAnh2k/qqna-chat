import express from "express";

import {
  createConversation,
  getConversations,
  getMessages,
  markAsRead,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/read", markAsRead);

export default router;
