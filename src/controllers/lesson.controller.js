import lessonService from '../services/lesson.service.js';
import { parsePaginationParams } from '../utils/pagination.js';

async function createLesson(req, res, next) {
  try {
    // req.user được sinh ra từ authMiddleware.authenticate chạy trước đó
    const currentUserId = req.user.id; 
    
    const newLesson = await lessonService.createLesson(req.body, currentUserId);
    res.status(201).json({
      message: 'Tạo bài học thành công!',
      data: newLesson
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function getLessonsByClass(req, res, next) {
  try {
    const { classId } = req.params;
    const paginationParams = parsePaginationParams(req.query, {
      allowedSortFields: ['order', 'created_at', 'title'],
      defaultSortBy: 'order',
      defaultSortOrder: 'ASC',
    });
    const { lessons, pagination } = await lessonService.getLessonsByClass(classId, paginationParams);
    res.status(200).json({ data: lessons, pagination });
  } catch (error) {
    next(error);
  }
}

const lessonController = {
  createLesson,
  getLessonsByClass
};

export default lessonController;
