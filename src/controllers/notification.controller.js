import notificationService from "../services/notification.service.js";

async function getMyNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.status(200).json({ data: notifications });
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