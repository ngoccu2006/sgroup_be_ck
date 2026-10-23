import { v4 as uuidv4 } from "uuid";
import notificationRepository from "../repositories/notification.repository.js";
import { getIO } from "../configs/socket.config.js";
import db from "../configs/db.js";

// 1. Hàm gửi thông báo riêng cho 1 User (Bảo gồm lưu DB + bắn Socket)
async function sendNotificationToUser(userId, title, message) {
  const notification = await notificationRepository.create({
    id: uuidv4(),
    user_id: userId,
    title,
    message,
  });

  // Bắn real-time event qua Socket.io tới room riêng của User
  try {
    const io = getIO();
    io.to(userId).emit("new_notification", notification);
  } catch (err) {
    console.log("Socket emit error:", err.message);
  }

  return notification;
}

// 2. Hàm gửi thông báo cho tất cả Member trong một Lớp
async function sendNotificationToClassMembers(classId, title, message) {
  // Lấy danh sách tất cả học viên trong lớp
  const query = `
    SELECT member_id FROM class_members 
    WHERE class_id = $1;
  `;
  const res = await db.query(query, [classId]);
  const members = res.rows;

  // Lặp qua từng member để gửi thông báo
  const promises = members.map((m) =>
    sendNotificationToUser(m.member_id, title, message)
  );

  await Promise.all(promises);
}

async function getUserNotifications(userId) {
  return await notificationRepository.findByUserId(userId);
}

async function markAsRead(notificationId, userId) {
  return await notificationRepository.markAsRead(notificationId, userId);
}

const notificationService = {
  sendNotificationToUser,
  sendNotificationToClassMembers,
  getUserNotifications,
  markAsRead,
};

export default notificationService;