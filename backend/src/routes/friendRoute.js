import express from "express";

import {
  acceptFriendRequest,
  declineFriendRequest,
  getAllFriends,
  sendFriendRequest,
  getFriendsRequests,
} from "../controllers/friendController.js";

const router = express.Router();

//thêm bạn
router.post("/requests", sendFriendRequest);

//chấp nhận lời mời kết bạn
router.post("/requests/:requestId/accept", acceptFriendRequest);

//từ chối lời mời kết bạn
router.post("/requests/:requestId/decline", declineFriendRequest);

//lấy danh sách bạn bè
router.get("/", getAllFriends);

//lấy danh sách lời mời kết bạn
router.get("/requests", getFriendsRequests);

export default router;
