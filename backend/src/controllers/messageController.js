import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, imgUrl } = req.body;
    const senderId = req.user._id;

    let conversation;

    if (!content && !imgUrl) {
      return res.status(400).json({ message: "Thiếu nội dung hoặc hình ảnh" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content: content || "",
      imgUrl: imgUrl || undefined,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, imgUrl } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content && !imgUrl) {
      return res.status(400).json("Thiếu nội dung hoặc hình ảnh");
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content: content || "",
      imgUrl: imgUrl || undefined,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const recallMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thu hồi tin nhắn này" });
    }

    message.content = "";
    message.imgUrl = undefined;
    message.isRecalled = true;
    await message.save();

    // Phát sự kiện socket tới phòng hội thoại
    io.to(message.conversationId.toString()).emit("message-recalled", {
      messageId: message._id,
      conversationId: message.conversationId,
    });

    return res
      .status(200)
      .json({ message: "Thu hồi tin nhắn thành công", message });
  } catch (error) {
    console.error("Lỗi xảy ra khi thu hồi tin nhắn:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadMessageImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Không tìm thấy file tải lên" });
    }

    // Tải ảnh lên thư mục qqna_chat/messages gốc mà không biến đổi tỉ lệ
    const result = await uploadImageFromBuffer(file.buffer, {
      folder: "qqna_chat/messages",
      transformation: [],
    });

    return res.status(200).json({ imgUrl: result.secure_url });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload ảnh tin nhắn", error);
    return res.status(500).json({ message: "Upload failed" });
  }
};
