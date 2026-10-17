import lessonService from '../services/lesson.service.js';

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
    const lessons = await lessonService.getLessonsByClass(classId);
    res.status(200).json({ data: lessons });
  } catch (error) {
    next(error);
  }
}

const lessonController = {
  createLesson,
  getLessonsByClass
};

export default lessonController;
