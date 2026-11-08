import db from "../configs/db.js";
import { buildPaginationSQL } from '../utils/pagination.js';

// Tạo thông báo mới
async function create(notificationData) {
  const { id, user_id, title, message } = notificationData;
  const query = `
    INSERT INTO notifications (id, user_id, title, message)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const res = await db.query(query, [id, user_id, title, message]);
  return res.rows[0];
}

// Lấy danh sách thông báo của User
async function findByUserId(userId, paginationParams) {
  const paginationSQL = buildPaginationSQL(paginationParams);
  const query = `
    SELECT * FROM notifications 
    WHERE user_id = $1 
    ${paginationSQL};
  `;
  const res = await db.query(query, [userId]);
  return res.rows;
}

// Đếm tổng số thông báo của user
async function countByUserId(userId) {
  const query = `SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1`;
  const res = await db.query(query, [userId]);
  return res.rows[0].total;
}

// Đánh dấu 1 thông báo là đã đọc
async function markAsRead(id, userId) {
  const query = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const res = await db.query(query, [id, userId]);
  return res.rows[0];
}

const notificationRepository = {
  create,
  findByUserId,
  countByUserId,
  markAsRead,
};

export default notificationRepository;