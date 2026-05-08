import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id; // Lấy ID người gửi từ token đã xác thực

    let conversation;

    if (!content) {
      return res.status(400).json({ message: "Thiếu nội dung" });
    }

    if (conversationId) {
      // Nếu đã có conversationId, tìm kiếm cuộc trò chuyện đó
      conversation = await Conversation.findById(conversationId);
    }
    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessage: new Date(),
        unreadCounts: new Map(),
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);
    await conversation.save();

    res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn trực tiếp:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id; // Lấy ID người gửi từ token đã xác thực

    const conversation = req.conversation; // conversation đã được middleware checkFriendship gắn vào req

    if (!content) {
      return res.status(400).json({ message: "Thiếu nội dung" });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);
    await conversation.save();

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn nhóm:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
