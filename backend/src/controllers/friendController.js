import Friend from "../models/Friend.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { io } from "../socket/index.js";

export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user._id;

    if (from === to) {
      return res
        .status(400)
        .json({ message: "Không thể gửi lời mời kết bạn cho chính mình" });
    }

    const userExits = await User.exists({ _id: to });

    if (!userExits) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    let UserA = from.toString();
    let UserB = to.toString();

    if (UserA > UserB) {
      [UserA, UserB] = [UserB, UserA];
    }

    const [alreadyFriends, exitingRequest] = await Promise.all([
      Friend.findOne({ userA: UserA, userB: UserB }),
      FriendRequest.findOne({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      }),
    ]);

    if (alreadyFriends) {
      return res.status(400).json({ message: "Hai người đã là bạn bè" });
    }

    if (exitingRequest) {
      return res
        .status(400)
        .json({ message: "Đã tồn tại lời mời kết bạn giữa hai người" });
    }

    const request = await FriendRequest.create({
      from,
      to,
      message,
    });

    const populatedRequest = await FriendRequest.findById(request._id)
      .populate("from", "_id displayName username avatarUrl")
      .populate("to", "_id displayName username avatarUrl")
      .lean();

    io.to(to.toString()).emit("new-friend-request", populatedRequest);

    return res
      .status(201)
      .json({ message: "gửi lời mời kết bạn thành công", request: populatedRequest });
  } catch (error) {
    console.error("Lỗi khi gọi sendFriendRequest:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chấp nhận lời mời kết bạn này" });
    }

    const friend = await Friend.create({
      userA: request.from,
      userB: request.to,
    });

    await FriendRequest.findByIdAndDelete(requestId);

    const from = await User.findById(request.from)
      .select("_id displayName email username avatarUrl")
      .lean();

    const to = await User.findById(request.to)
      .select("_id displayName email username avatarUrl")
      .lean();

    io.to(request.from.toString()).emit("friend-request-accepted", {
      newFriend: {
        _id: to?._id,
        displayName: to?.displayName,
        avatarUrl: to?.avatarUrl,
        username: to?.username,
      },
      requestId: request._id,
    });

    io.to(request.to.toString()).emit("friend-request-accepted", {
      newFriend: {
        _id: from?._id,
        displayName: from?.displayName,
        avatarUrl: from?.avatarUrl,
        username: from?.username,
      },
      requestId: request._id,
    });

    return res.status(200).json({
      message: "Chấp nhận lời mời kết bạn thành công",
      newFriend: {
        _id: from?._id,
        displayName: from?.displayName,
        avatarUrl: from?.avatarUrl,
        username: from?.username,
      },
    });
  } catch (error) {
    console.error("Lỗi khi gọi acceptFriendRequest:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền từ chối lời mời kết bạn này" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    io.to(request.from.toString()).emit("friend-request-declined", { requestId });
    io.to(request.to.toString()).emit("friend-request-declined", { requestId });

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi declineFriendRequest:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.find({
      $or: [{ userA: userId }, { userB: userId }],
    })
      .populate("userA", "_id displayName avatarUrl username")
      .populate("userB", "_id displayName avatarUrl username")
      .lean();

    // Lọc bỏ những kết bạn chứa tài khoản đã bị xóa khỏi DB
    const validFriendships = friendships.filter((f) => f.userA && f.userB);

    if (!validFriendships.length) {
      return res.status(200).json({ friends: [] });
    }

    const friends = validFriendships.map((f) => {
      const friendObj =
        f.userA._id.toString() === userId.toString() ? f.userB : f.userA;

      return {
        _id: friendObj._id,
        displayName: friendObj.displayName,
        avatarUrl: friendObj.avatarUrl,
        username: friendObj.username,
      };
    });

    return res.status(200).json({ friends });
  } catch (error) {
    console.error("Lỗi khi gọi getAllFriends:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getFriendsRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const populateFields = "_id displayName username avatarUrl";

    const [sent, received] = await Promise.all([
      FriendRequest.find({ from: userId }).populate("to", populateFields),

      FriendRequest.find({ to: userId }).populate("from", populateFields),
    ]);

    // Lọc bỏ những yêu cầu kết bạn liên quan đến tài khoản đã bị xóa khỏi DB
    const validSent = sent.filter((r) => r.to !== null);
    const validReceived = received.filter((r) => r.from !== null);

    return res.status(200).json({ sent: validSent, received: validReceived });
  } catch (error) {
    console.error("Lỗi khi gọi getFriendsRequests:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const unfriend = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.params;

    let userA = userId.toString();
    let userB = friendId.toString();

    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const result = await Friend.findOneAndDelete({ userA, userB });

    if (!result) {
      return res.status(404).json({ message: "Hai người chưa kết bạn" });
    }

    io.to(userA).emit("unfriended", { friendId: userB });
    io.to(userB).emit("unfriended", { friendId: userA });

    return res.status(200).json({ message: "Hủy kết bạn thành công" });
  } catch (error) {
    console.error("Lỗi xảy ra khi hủy kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
