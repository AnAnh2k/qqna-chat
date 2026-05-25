import express from "express";
import {
  authMe,
  searchUserByUsername,
  uploadAvatar,
  getUserById,
  updateMe,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", authMe);
router.patch("/me", updateMe);
router.get("/search", searchUserByUsername);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);
router.get("/:userId", getUserById);

export default router;
