export const updateConversationAfterCreateMessage = async (
  conversation,
  message,
  senderId,
) => {
  try {
    conversation.set({
      seenBy: [],
      lastMessageAt: message.createdAt,
      lastMessage: {
        _id: message._id,
        content: message.content,
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

export const emitNewMessage = (io, conversation, message) => {
  io.to(conversation._id.toString()).emit("new-message", {
    message,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
    },
    unreadCounts: conversation.unreadCounts,
  });
};
