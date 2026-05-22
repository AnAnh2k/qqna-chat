import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";

const formatConversation = (convo) => {
  const plainConvo = convo.toObject ? convo.toObject() : convo;
  const participants = (plainConvo.participants || []).map((p) => ({
    _id: p.userId?._id,
    displayName: p.userId?.displayName,
    avatarUrl: p.userId?.avatarUrl ?? null,
    joinedAt: p.joinedAt,
  }));

  const unreadCounts =
    plainConvo.unreadCounts instanceof Map
      ? Object.fromEntries(plainConvo.unreadCounts)
      : plainConvo.unreadCounts || {};

  return {
    ...plainConvo,
    unreadCounts,
    participants,
  };
};

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;
    if (
      !type ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res.status(400).json({
        message: "Tên cuộc trò chuyện và danh sách thành viên là bắt buộc",
      });
    }

    if (type === "group" && !name) {
      return res.status(400).json({ message: "Tên nhóm là bắt buộc" });
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
          participants: [{ userId: userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });
        await conversation.save();
      }
    } else if (type === "group") {
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
    } else {
      return res
        .status(400)
        .json({ message: "conversation type không hợp lệ" });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      {
        path: "seenBy",
        select: "displayName avatarUrl",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    res.status(201).json({ conversation: formatConversation(conversation) });
  } catch (error) {
    console.error("Lỗi khi gọi createConversation:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
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
        path: "seenBy",
        select: "displayName avatarUrl",
      });

    const formatted = conversations.map(formatConversation);

    res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error("Lỗi khi gọi getConversations:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const query = {
      conversationId,
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }

    messages = messages.reverse();

    return res.status(200).json({ messages, nextCursor });
  } catch (error) {
    console.error("Lỗi khi gọi getMessages:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString(),
    );
    if (!isParticipant) {
      return res
        .status(403)
        .json({ message: "Không có quyền truy cập cuộc trò chuyện này" });
    }

    conversation.unreadCounts.set(userId.toString(), 0);

    if (!conversation.seenBy.includes(userId)) {
      conversation.seenBy.push(userId);
    }

    await conversation.save();

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi markAsRead:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
