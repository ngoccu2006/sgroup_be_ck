import notificationService from "../services/notification.service.js";
import { parsePaginationParams } from '../utils/pagination.js';

async function getMyNotifications(req, res, next) {
  try {
    const paginationParams = parsePaginationParams(req.query, {
      allowedSortFields: ['created_at'],
      defaultSortBy: 'created_at',
      defaultSortOrder: 'DESC',
    });
    // Thêm isRead filter
    paginationParams.isRead = req.query.isRead || '';

    const { notifications, pagination } = await notificationService.getUserNotifications(req.user.id, paginationParams);
    res.status(200).json({ data: notifications, pagination });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await notificationService.markAsRead(id, req.user.id);
    res.status(200).json({ message: "Đã đánh dấu là đã đọc!", data: updated });
  } catch (error) {
    next(error);
  }
}

const notificationController = {
  getMyNotifications,
  markAsRead,
};

export default notificationController;
