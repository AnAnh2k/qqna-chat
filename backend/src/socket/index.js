import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map(); // {userIdStr: Set<socketId>}

io.on("connection", async (socket) => {
  const user = socket.user;
  const userIdStr = user._id.toString();

  // console.log(`${user.displayName} online với socket ${socket.id}`);

  if (!onlineUsers.has(userIdStr)) {
    onlineUsers.set(userIdStr, new Set());
  }
  onlineUsers.get(userIdStr).add(socket.id);

  io.emit("online-users", Array.from(onlineUsers.keys()));

  const conversationIds = await getUserConversationsForSocketIO(user._id);
  conversationIds.forEach((id) => {
    socket.join(id);
  });

  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("leave-conversation", (conversationId) => {
    socket.leave(conversationId);
  });

  socket.join(userIdStr);

  socket.on("disconnect", () => {
    const sockets = onlineUsers.get(userIdStr);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userIdStr);
      }
    }
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`socket disconnected: ${socket.id}`);
  });
});

export { io, app, server };
