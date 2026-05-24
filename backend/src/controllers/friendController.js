import Friend from "../models/Friend.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

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

    return res
      .status(201)
      .json({ message: "gửi lời mời kết bạn thành công", request });
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
      .select("_id displayName email username")
      .lean();

    const to = await User.findById(request.to)
      .select("_id displayName email username")
      .lean();

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

    if (!friendships.length) {
      return res.status(200).json({ friends: [] });
    }

    const friends = friendships.map((f) => {
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

    return res.status(200).json({ sent, received });
  } catch (error) {
    console.error("Lỗi khi gọi getFriendsRequests:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
