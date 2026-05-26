import Conversation from "../models/Conversation.js";

const formatUnreadCounts = (unreadCounts) => {
  if (!unreadCounts) {
    return {};
  }

  if (unreadCounts instanceof Map) {
    return Object.fromEntries(unreadCounts);
  }

  return unreadCounts;
};

const getLastMessageContent = (message) => {
  if (message.messageType === "post") {
    return "đã gửi một bài viết";
  }

  return message.content;
};

export const updateConversationAfterCreateMessage = async (
  conversation,
  message,
  senderId,
) => {
  try {
    const existingIndex = conversation.seenBy.findIndex(
      (s) => s.userId && s.userId.toString() === senderId.toString()
    );

    if (existingIndex > -1) {
      conversation.seenBy[existingIndex].seenAt = new Date();
      conversation.seenBy[existingIndex].messageId = message._id.toString();
    } else {
      conversation.seenBy.push({
        userId: senderId,
        seenAt: new Date(),
        messageId: message._id.toString(),
      });
    }

    conversation.set({
      seenBy: conversation.seenBy,
      lastMessageAt: message.createdAt,
      lastMessage: {
        _id: message._id,
        content: getLastMessageContent(message),
        imgUrl: message.imgUrl || null,
        messageType: message.messageType || "user",
        senderId,
        createdAt: message.createdAt,
      },
    });

    conversation.participants.forEach((p) => {
      const memberId = p.userId.toString();
      const isSender = memberId === senderId.toString();
      const prevCount = conversation.unreadCounts.get(memberId) || 0;
      conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
    });
  } catch (error) {
    console.error(
      "Lỗi khi cập nhật cuộc trò chuyện sau khi tạo tin nhắn:",
      error,
    );
  }
};

export const emitNewMessage = async (io, conversation, message) => {
  const populatedConversation = await Conversation.findById(conversation._id)
    .select("_id lastMessage lastMessageAt seenBy unreadCounts")
    .populate({ path: "seenBy.userId", select: "displayName avatarUrl" })
    .lean();

  const conversationPayload = populatedConversation ?? {
    _id: conversation._id,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    seenBy: conversation.seenBy,
    unreadCounts: formatUnreadCounts(conversation.unreadCounts),
  };

  io.to(conversation._id.toString()).emit("new-message", {
    message,
    conversation: conversationPayload,
    unreadCounts: formatUnreadCounts(conversationPayload.unreadCounts),
  });
};
