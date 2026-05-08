import { Server } from "socket.io";

let io = null;

export const initSocket = (server) => {
  if (io) return io;
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
  return io;
};
