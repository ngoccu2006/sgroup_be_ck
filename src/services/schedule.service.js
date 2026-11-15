import { v4 as uuidv4 } from "uuid";
import scheduleRepository from "../repositories/schedule.repository.js";
import classRepository from "../repositories/class.repository.js";
import classMemberRepository from "../repositories/classMember.repository.js";
import lessonRepository from "../repositories/lesson.repository.js";
import { buildPaginationMeta } from "../utils/pagination.js";

function throwError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

// Mentor chỉ được quản lý lịch của class mình phụ trách (admin thì được tất cả)
async function assertCanManageClass(classId, user) {
  const cls = await classRepository.findById(classId);
  if (!cls) throwError("Lớp học không tồn tại!", 404);
  if (user.role !== "ADMIN" && cls.mentor_id !== user.id) {
    throwError("Bạn không phải mentor của lớp này!", 403);
  }
}

// Lesson phải tồn tại và thuộc đúng class của buổi học
async function getLessonOfClass(lessonId, classId) {
  const lesson = await lessonRepository.findById(lessonId);
  if (!lesson) throwError("Bài học không tồn tại!", 404);
  if (lesson.class_id !== classId) {
    throwError("Bài học không thuộc lớp này!", 400);
  }
  return lesson;
}

function validateSchedule({start_time, end_time }) {
  if (end_time.slice(0, 5) <= start_time.slice(0, 5)) {
    throwError("Giờ kết thúc phải sau giờ bắt đầu!", 400);
  }
}

async function createSchedule(classId, body, user) {
  await assertCanManageClass(classId, user);
  validateSchedule(body);

  // Nếu gắn lesson mà không nhập title thì lấy title của lesson
  let title = body.title;
  if (body.lesson_id) {
    const lesson = await getLessonOfClass(body.lesson_id, classId);
    title = title || lesson.title;
  }

  const overlap = await scheduleRepository.findOverlap(
    classId, body.session_date, body.start_time, body.end_time
  );
  if (overlap) {
    throwError(`Trùng giờ với buổi học "${overlap.title}"!`, 400);
  }

  return await scheduleRepository.create({
    id: uuidv4(),
    class_id: classId,
    lesson_id: body.lesson_id || null,
    title,
    session_date: body.session_date,
    start_time: body.start_time,
    end_time: body.end_time,
    location: body.location || null,
    note: body.note || null,
    created_by: user.id,
  });
}

async function getSchedulesByClass(classId, user, paginationParams) {
  const cls = await classRepository.findById(classId);
  if (!cls) throwError("Lớp học không tồn tại!", 404);

  // Xem được: admin, mentor của lớp, hoặc member thuộc lớp
  if (user.role !== "ADMIN" && cls.mentor_id !== user.id) {
    const isMember = await classMemberRepository.isMember(classId, user.id);
    if (!isMember) throwError("Bạn không thuộc lớp này!", 403);
  }

  const [schedules, totalItems] = await Promise.all([
    scheduleRepository.findByClassId(classId, paginationParams),
    scheduleRepository.countByClassId(classId),
  ]);
  const pagination = buildPaginationMeta(paginationParams.page, paginationParams.limit, totalItems);
  return { schedules, pagination };
}

async function updateSchedule(id, body, user) {
  const existing = await scheduleRepository.findById(id);
  if (!existing) throwError("Buổi học không tồn tại!", 404);
  await assertCanManageClass(existing.class_id, user);

  // lesson_id: không gửi = giữ nguyên, gửi null = bỏ liên kết, gửi id = đổi lesson
  let lessonId = existing.lesson_id;
  let title = body.title ?? existing.title;
  if (body.lesson_id !== undefined) {
    lessonId = body.lesson_id;
    if (lessonId) {
      const lesson = await getLessonOfClass(lessonId, existing.class_id);
      // đổi sang lesson khác mà không nhập title mới thì lấy title của lesson
      if (body.title === undefined) title = lesson.title;
    }
  }

  // Gộp dữ liệu cũ với dữ liệu gửi lên (PATCH chỉ cần gửi field muốn đổi)
  const merged = {
    lesson_id: lessonId,
    title,
    session_date: body.session_date ?? existing.session_date,
    start_time: body.start_time ?? existing.start_time,
    end_time: body.end_time ?? existing.end_time,
    location: body.location !== undefined ? body.location : existing.location,
    note: body.note !== undefined ? body.note : existing.note,
  };
  validateSchedule(merged);

  const overlap = await scheduleRepository.findOverlap(
    existing.class_id, merged.session_date, merged.start_time, merged.end_time, id
  );
  if (overlap) {
    throwError(`Trùng giờ với buổi học "${overlap.title}"!`, 400);
  }

  return await scheduleRepository.update(id, merged);
}

async function deleteSchedule(id, user) {
  const existing = await scheduleRepository.findById(id);
  if (!existing) throwError("Buổi học không tồn tại!", 404);
  await assertCanManageClass(existing.class_id, user);
  await scheduleRepository.remove(id);
}

const scheduleService = {
  createSchedule,
  getSchedulesByClass,
  updateSchedule,
  deleteSchedule,
};

export default scheduleService;
