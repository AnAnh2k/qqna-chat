import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";

const pair = (a, b) => (a < b ? [a, b] : [b, a]);

export const checkFriendship = async (req, res, next) => {
  try {
    const me = req.user._id.toString(); // Lấy ID người dùng từ token đã xác thực
    const recipientId = req.body?.recipientId ?? null; // Lấy ID bạn bè từ tham số URL
    const memberIds = req.body?.memberIds ?? []; // Lấy danh sách thành viên từ body (dành cho chat nhóm)

    if (!recipientId && memberIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Thiếu recipientId hoặc memberIds" });
    }

    if (recipientId) {
      const [userA, userB] = pair(me, recipientId);

      const isFriend = await Friend.findOne({
        userA,
        userB,
      });

      if (!isFriend) {
        return res
          .status(403)
          .json({ message: "Bạn chưa kết bạn với người dùng này" });
      }

      return next();
    }

    //todo: chat nhóm

    const friendChecks = memberIds.map(async (memberId) => {
      const [userA, userB] = pair(me, memberId);
      const friend = await Friend.findOne({
        userA,
        userB,
      });
      return friend ? null : memberId; // Nếu không phải bạn bè, trả về memberId
    });

    const results = await Promise.all(friendChecks);

    const notFriends = results.filter(Boolean);

    if (notFriends.length > 0) {
      return res.status(403).json({
        message: "Bạn chưa kết bạn với một số người dùng trong nhóm",
        notFriends,
      });
    }

    next();
  } catch (error) {
    console.error("Lỗi xảy ra khi checkFriendship:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const checkGroupMembership = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Cuộc trò chuyện không tồn tại" });
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString(),
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "Bạn không phải thành viên của cuộc trò chuyện này" });
    }

    req.conversation = conversation; // Gắn conversation vào req để controller có thể sử dụng
    next();
  } catch (error) {
    console.error("Lỗi xảy ra khi checkGroupMembership:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
