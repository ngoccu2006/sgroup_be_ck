import lessonRepository from '../repositories/lesson.repository.js';
import { v4 as uuidv4 } from 'uuid';
import { buildPaginationMeta } from '../utils/pagination.js';

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

async function getLessonsByClass(classId, paginationParams) {
  const [lessons, totalItems] = await Promise.all([
    lessonRepository.findByClassId(classId, paginationParams),
    lessonRepository.countByClassId(classId),
  ]);
  const pagination = buildPaginationMeta(paginationParams.page, paginationParams.limit, totalItems);
  return { lessons, pagination };
}

const lessonService = {
  createLesson,
  getLessonsByClass
};

export default lessonService;
