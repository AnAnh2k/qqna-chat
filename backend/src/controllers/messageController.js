import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";

const conversationPopulatePaths = [
  { path: "participants.userId", select: "displayName avatarUrl" },
  { path: "seenBy.userId", select: "displayName avatarUrl" },
  { path: "lastMessage.senderId", select: "displayName avatarUrl" },
  {
    path: "pinnedMessages.messageId",
    populate: { path: "senderId", select: "displayName avatarUrl" },
  },
  { path: "pinnedMessages.pinnedBy", select: "displayName avatarUrl" },
];

const formatConversation = (conversation) => {
  const participants = (conversation.participants || []).map((p) => ({
    _id: p.userId?._id,
    displayName: p.userId?.displayName,
    avatarUrl: p.userId?.avatarUrl ?? null,
    joinedAt: p.joinedAt,
  }));

  return { ...conversation.toObject(), participants };
};

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, imgUrl, imgUrls, title, messageType, replyTo } = req.body;
    const senderId = req.user._id;

    let conversation;
    let createdConversation = false;

    if (!content && !imgUrl && !title && (!imgUrls || imgUrls.length === 0)) {
      return res.status(400).json({ message: "Thiếu nội dung hoặc hình ảnh" });
    }

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        type: "direct",
        "participants.userId": { $all: [senderId, recipientId] },
      });
    }

    if (!conversation) {
      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [senderId, recipientId] },
      });
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
      createdConversation = true;
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content: content || "",
      imgUrl: imgUrl || undefined,
      imgUrls: imgUrls || [],
      title: title || undefined,
      messageType: messageType || "user",
      replyTo: replyTo || undefined,
    });

    const populatedMessage = await message.populate("replyTo");

    updateConversationAfterCreateMessage(conversation, populatedMessage, senderId);

    await conversation.save();

    if (createdConversation) {
      const populatedConversation = await Conversation.findById(conversation._id)
        .populate(conversationPopulatePaths);

      const formattedConversation = formatConversation(populatedConversation);
      io.to(senderId.toString()).emit("new-group", formattedConversation);
      io.to(recipientId.toString()).emit("new-group", formattedConversation);
    }

    await emitNewMessage(io, conversation, populatedMessage);

    return res.status(201).json({ message: populatedMessage });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, imgUrl, imgUrls, mentionedUserIds = [], title, messageType, replyTo } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content && !imgUrl && !title && (!imgUrls || imgUrls.length === 0)) {
      return res.status(400).json("Thiếu nội dung hoặc hình ảnh");
    }

    const participantIds = new Set(
      conversation.participants.map((p) => p.userId.toString()),
    );
    const mentions = [
      ...new Set(
        mentionedUserIds
          .map((id) => id?.toString())
          .filter(
            (id) =>
              id &&
              id !== senderId.toString() &&
              participantIds.has(id),
          ),
      ),
    ];

    const message = await Message.create({
      conversationId,
      senderId,
      content: content || "",
      imgUrl: imgUrl || undefined,
      imgUrls: imgUrls || [],
      mentions,
      title: title || undefined,
      messageType: messageType || "user",
      replyTo: replyTo || undefined,
    });

    const populatedMessage = await message.populate("replyTo");

    updateConversationAfterCreateMessage(conversation, populatedMessage, senderId);

    await conversation.save();
    await emitNewMessage(io, conversation, populatedMessage);

    const conversationName = conversation.group?.name || "nhóm";
    mentions.forEach((mentionedUserId) => {
      io.to(mentionedUserId).emit("mention-notification", {
        conversationId: conversation._id,
        conversationName,
        senderId,
        senderName: req.user.displayName,
        messageId: populatedMessage._id,
      });
    });

    return res.status(201).json({ message: populatedMessage });
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

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      const prevPinnedCount = conversation.pinnedMessages.length;
      conversation.pinnedMessages = conversation.pinnedMessages.filter(
        (item) => item.messageId.toString() !== message._id.toString(),
      );

      if (conversation.pinnedMessages.length !== prevPinnedCount) {
        await conversation.save();
        await conversation.populate(conversationPopulatePaths);
        io.to(message.conversationId.toString()).emit(
          "group-updated",
          formatConversation(conversation),
        );
      }
    }

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

export const updatePostMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { title, content, imgUrls } = req.body;
    const userId = req.user._id;

    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    const trimmedContent = typeof content === "string" ? content.trim() : "";
    const sanitizedImgUrls = Array.isArray(imgUrls)
      ? imgUrls.filter((url) => typeof url === "string" && url.trim())
      : [];

    if (!trimmedTitle) {
      return res.status(400).json({ message: "Tiêu đề bài viết không được để trống" });
    }

    if (!trimmedContent) {
      return res.status(400).json({ message: "Nội dung bài viết không được để trống" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy bài viết" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền sửa bài viết này" });
    }

    if (message.messageType !== "post" || message.isRecalled) {
      return res.status(400).json({ message: "Chỉ có thể sửa bài viết đang hiển thị" });
    }

    message.title = trimmedTitle;
    message.content = trimmedContent;
    message.imgUrl = sanitizedImgUrls.length === 1 ? sanitizedImgUrls[0] : undefined;
    message.imgUrls = sanitizedImgUrls.length > 1 ? sanitizedImgUrls : [];
    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation?.lastMessage?._id?.toString() === message._id.toString()) {
      conversation.lastMessage.content = "đã gửi một bài viết";
      conversation.lastMessage.imgUrl = message.imgUrl || null;
      conversation.lastMessage.messageType = "post";
      conversation.lastMessageAt = message.createdAt;
      await conversation.save();
    }

    io.to(message.conversationId.toString()).emit("message-updated", {
      message,
      conversationId: message.conversationId,
    });

    return res.status(200).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi sửa bài viết:", error);
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

export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ message: "Thiếu biểu tượng cảm xúc" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    }

    const existingReactionIdx = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingReactionIdx > -1) {
      if (message.reactions[existingReactionIdx].emoji === emoji) {
        // Nếu cùng emoji, xóa cảm xúc
        message.reactions.splice(existingReactionIdx, 1);
      } else {
        // Nếu khác emoji, cập nhật emoji mới
        message.reactions[existingReactionIdx].emoji = emoji;
      }
    } else {
      // Nếu chưa có, thêm mới
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Phát sự kiện socket
    io.to(message.conversationId.toString()).emit("message-reaction", {
      messageId: message._id,
      conversationId: message.conversationId,
      reactions: message.reactions,
    });

    return res.status(200).json({
      messageId: message._id,
      reactions: message.reactions,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi thả cảm xúc tin nhắn:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
