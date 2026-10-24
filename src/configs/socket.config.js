import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true
  });

  // Middleware xác thực JWT khi Client thiết lập kết nối Socket
  io.use((socket, next) => {
    // Lấy token từ handshake auth hoặc header
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      // Decode JWT Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
      socket.user = decoded; // Lưu user payload (id, role) vào socket instance
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Tự động join room theo user ID từ JWT Token đã verify
    const userId = socket.user.id;
    socket.join(userId);
    console.log(`🔌 Client connected & joined room: ${userId} (Socket ID: ${socket.id})`);

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io chưa được khởi tạo!");
  }
  return io;
}