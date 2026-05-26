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
        content: message.content,
        imgUrl: message.imgUrl || null,
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
