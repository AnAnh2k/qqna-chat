import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Friend from "../models/Friend.js";
import { io } from "../socket/index.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";

const pair = (a, b) => (a < b ? [a, b] : [b, a]);

const formatConversation = (conversation) => {
  const participants = (conversation.participants || []).map((p) => ({
    _id: p.userId?._id,
    displayName: p.userId?.displayName,
    avatarUrl: p.userId?.avatarUrl ?? null,
    joinedAt: p.joinedAt,
  }));

  return { ...conversation.toObject(), participants };
};

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (
      !type ||
      (type === "group" && !name) ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" });
    }

    let conversation;

    if (type === "direct") {
      const participantId = memberIds[0];

      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [userId, participantId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          type: "direct",
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });

        await conversation.save();
      }
    }

    if (type === "group") {
      conversation = new Conversation({
        type: "group",
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: "Conversation type không hợp lệ" });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      {
        path: "seenBy.userId",
        select: "displayName avatarUrl",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const participants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    if (type === "group") {
      memberIds.forEach((userId) => {
        io.to(userId).emit("new-group", formatted);
      });
    }

    if (type === "direct") {
      io.to(userId).emit("new-group", formatted);
      io.to(memberIds[0]).emit("new-group", formatted);
    }

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi tạo conversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "seenBy.userId",
        select: "displayName avatarUrl",
      });

    const formatted = conversations.map((convo) => {
      const participant = convo.participants.find(
        (p) => p.userId?._id.toString() === userId.toString()
      );

      let isCleared = false;
      if (participant?.clearedAt) {
        if (!convo.lastMessageAt) {
          isCleared = true;
        } else {
          isCleared = new Date(convo.lastMessageAt) <= new Date(participant.clearedAt);
        }
      }

      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        joinedAt: p.joinedAt,
      }));

      return {
        ...convo.toObject(),
        unreadCounts: convo.unreadCounts || {},
        participants,
        isCleared,
      };
    });

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy conversations", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;
    const userId = req.user._id;

    // Tìm cuộc trò chuyện để lấy thông tin clearedAt của user
    const conversation = await Conversation.findOne({
      _id: conversationId,
      "participants.userId": userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại hoặc bạn không phải thành viên" });
    }

    const participant = conversation.participants.find(
      (p) => p.userId.toString() === userId.toString()
    );
    const clearedAt = participant?.clearedAt;

    const query = { conversationId };

    if (cursor) {
      query.createdAt = {
        $lt: new Date(cursor),
        ...(clearedAt ? { $gt: clearedAt } : {})
      };
    } else if (clearedAt) {
      query.createdAt = { $gt: clearedAt };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1)
      .populate("replyTo");

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }

    messages = messages.reverse();

    return res.status(200).json({
      messages,
      nextCursor,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy messages", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find(
      { "participants.userId": userId },
      { _id: 1 },
    );

    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Lỗi khi fetch conversations: ", error);
    return [];
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation không tồn tại" });
    }

    const last = conversation.lastMessage;

    if (!last) {
      return res.status(200).json({ message: "Không có tin nhắn để mark as seen" });
    }

    if (last.senderId.toString() === userId) {
      return res.status(200).json({ message: "Sender không cần mark as seen" });
    }

    const existingIndex = conversation.seenBy.findIndex(
      (s) => s.userId && s.userId.toString() === userId
    );

    if (existingIndex > -1) {
      conversation.seenBy[existingIndex].seenAt = new Date();
      conversation.seenBy[existingIndex].messageId = last._id.toString();
    } else {
      conversation.seenBy.push({
        userId,
        seenAt: new Date(),
        messageId: last._id.toString(),
      });
    }

    conversation.unreadCounts.set(userId, 0);

    await conversation.save();

    const populated = await Conversation.findById(conversationId)
      .populate({ path: "participants.userId", select: "displayName avatarUrl" })
      .populate({ path: "seenBy.userId", select: "displayName avatarUrl" })
      .populate({ path: "lastMessage.senderId", select: "displayName avatarUrl" })
      .lean();

    io.to(conversationId).emit("read-message", {
      conversation: populated,
      lastMessage: {
        _id: populated?.lastMessage._id,
        content: populated?.lastMessage.content,
        imgUrl: populated?.lastMessage.imgUrl ?? null,
        messageType: populated?.lastMessage.messageType,
        createdAt: populated?.lastMessage.createdAt,
        sender: {
          _id: populated?.lastMessage.senderId?._id ?? populated?.lastMessage.senderId,
          displayName: populated?.lastMessage.senderId?.displayName ?? "",
          avatarUrl: populated?.lastMessage.senderId?.avatarUrl ?? null,
        },
      },
    });

    return res.status(200).json({
      message: "Marked as seen",
      seenBy: populated?.seenBy || [],
      myUnreadCount: populated?.unreadCounts?.[userId] || 0,
    });
  } catch (error) {
    console.error("Lỗi khi mark as seen", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const clearConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Cập nhật trường clearedAt cho participant tương ứng và reset unread counts
    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        "participants.userId": userId,
      },
      {
        $set: {
          "participants.$.clearedAt": new Date(),
          [`unreadCounts.${userId}`]: 0,
        },
      },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại hoặc bạn không phải thành viên" });
    }

    return res.status(200).json({ message: "Đã xóa lịch sử cuộc trò chuyện thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa cuộc trò chuyện:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group",
      "participants.userId": userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Nhóm không tồn tại hoặc bạn không phải thành viên",
      });
    }

    if (conversation.group?.createdBy?.toString() === userId.toString()) {
      return res.status(403).json({
        message: "Trưởng nhóm chỉ có thể giải tán nhóm",
      });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== userId.toString(),
    );
    conversation.unreadCounts?.delete(userId.toString());
    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
      { path: "seenBy.userId", select: "displayName avatarUrl" },
    ]);

    const participants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    io.to(conversationId).emit("group-updated", formatted);
    io.to(userId.toString()).emit("group-removed", { conversationId });

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi rời nhóm:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Vui lòng chọn ít nhất một thành viên" });
    }

    const uniqueMemberIds = [...new Set(memberIds.map((id) => id.toString()))];

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group",
      "participants.userId": userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Nhóm không tồn tại hoặc bạn không phải thành viên",
      });
    }

    const existingIds = new Set(
      conversation.participants.map((p) => p.userId.toString()),
    );

    const newMemberIds = uniqueMemberIds.filter(
      (id) => !existingIds.has(id) && id !== userId.toString(),
    );

    if (newMemberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Các thành viên này đã có trong nhóm" });
    }

    const notFriends = [];
    await Promise.all(
      newMemberIds.map(async (memberId) => {
        const [userA, userB] = pair(userId.toString(), memberId);
        const friendship = await Friend.findOne({ userA, userB });
        if (!friendship) {
          notFriends.push(memberId);
        }
      }),
    );

    if (notFriends.length > 0) {
      return res.status(403).json({
        message: "Bạn chỉ có thể thêm bạn bè vào nhóm",
        notFriends,
      });
    }

    conversation.participants.push(
      ...newMemberIds.map((memberId) => ({ userId: memberId })),
    );
    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
      { path: "seenBy.userId", select: "displayName avatarUrl" },
    ]);

    const addedNames = conversation.participants
      .filter((p) => newMemberIds.includes(p.userId?._id.toString()))
      .map((p) => p.userId?.displayName)
      .filter(Boolean);
    const systemMessage = await Message.create({
      conversationId,
      senderId: userId,
      content: `${req.user.displayName} đã thêm ${addedNames.join(", ")} vào nhóm`,
      messageType: "system",
    });

    updateConversationAfterCreateMessage(conversation, systemMessage, userId);
    await conversation.save();

    const formatted = formatConversation(conversation);

    io.to(conversationId).emit("group-updated", formatted);
    await emitNewMessage(io, conversation, systemMessage);
    newMemberIds.forEach((memberId) => {
      io.to(memberId).emit("new-group", formatted);
    });

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi thêm thành viên vào nhóm:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const disbandGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group",
      "participants.userId": userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Nhóm không tồn tại hoặc bạn không phải thành viên",
      });
    }

    if (conversation.group?.createdBy?.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Chỉ trưởng nhóm mới có thể giải tán nhóm",
      });
    }

    await Message.deleteMany({ conversationId });
    await Conversation.deleteOne({ _id: conversationId });

    io.to(conversationId).emit("group-removed", { conversationId });

    return res.status(200).json({ message: "Đã giải tán nhóm" });
  } catch (error) {
    console.error("Lỗi khi giải tán nhóm:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateGroupName = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Tên nhóm không được để trống" });
    }

    const trimmedName = name.trim();

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group",
      "participants.userId": userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Nhóm không tồn tại hoặc bạn không phải thành viên",
      });
    }

    conversation.group.name = trimmedName;

    const systemMessage = await Message.create({
      conversationId,
      senderId: userId,
      content: `${req.user.displayName} đã đổi tên nhóm thành "${trimmedName}"`,
      messageType: "system",
    });

    updateConversationAfterCreateMessage(conversation, systemMessage, userId);
    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
      { path: "seenBy.userId", select: "displayName avatarUrl" },
    ]);

    const formatted = formatConversation(conversation);

    io.to(conversationId).emit("group-updated", formatted);
    await emitNewMessage(io, conversation, systemMessage);

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi đổi tên nhóm:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadGroupAvatar = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Không tìm thấy file tải lên" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: "group",
      "participants.userId": userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Nhóm không tồn tại hoặc bạn không phải thành viên",
      });
    }

    const result = await uploadImageFromBuffer(file.buffer, {
      folder: "qqna_chat/group_avatars",
    });

    conversation.group.avatarUrl = result.secure_url;
    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
      { path: "seenBy.userId", select: "displayName avatarUrl" },
    ]);

    const formatted = formatConversation(conversation);

    io.to(conversationId).emit("group-updated", formatted);

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi upload avatar nhóm:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
