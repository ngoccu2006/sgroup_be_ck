import lessonRepository from '../repositories/lesson.repository.js';
import { v4 as uuidv4 } from 'uuid';

async function createLesson(lessonData, currentUserId) {
  const {class_id, order} = lessonData;
  // Kiểm tra xem bài học với class_id và order đã tồn tại chưa
  const existingLesson = await lessonRepository.findByClassAndOrder(class_id, order);
  if (existingLesson) {
    // Ném ra lỗi để Middleware xử lý lỗi (error handler) bắt được
    const error = new Error(`Bài học số ${order} đã tồn tại trong lớp này!`);
    error.statusCode = 400; // Bad Request
    throw error;
  }
  const newLessonData = {
    id: uuidv4(),
    ...lessonData,
    created_by: currentUserId // Tự động lấy ID của Mentor/Admin đang đăng nhập
  };
  return await lessonRepository.create(newLessonData);
}

async function getLessonsByClass(classId) {
  return await lessonRepository.findByClassId(classId);
}

const lessonService = {
  createLesson,
  getLessonsByClass
};

export default lessonService;
