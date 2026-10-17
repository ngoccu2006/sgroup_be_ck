import db from "../configs/db.js";

// Đánh dấu bài học đã hoàn thành
async function markComplete(id, lessonId, memberId) {
  const res = await db.query(
    `INSERT INTO lesson_progress (id, lesson_id, member_id, completed_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (lesson_id, member_id) DO UPDATE 
     SET completed_at = CURRENT_TIMESTAMP
     RETURNING id, lesson_id, member_id, completed_at`,
    [id, lessonId, memberId]
  );
  return res.rows[0];
}

// Đếm tổng số bài học của một lớp
async function countTotalLessonsByClass(classId) {
  const res = await db.query(
    `SELECT COUNT(*)::int AS total FROM lessons WHERE class_id = $1`,
    [classId]
  );
  return res.rows[0].total;
}

// Đếm số bài học đã hoàn thành của một học viên trong lớp
async function countCompletedLessonsByMember(classId, memberId) {
  const res = await db.query(
    `SELECT COUNT(lp.id)::int AS completed
     FROM lesson_progress lp
     JOIN lessons l ON lp.lesson_id = l.id
     WHERE l.class_id = $1 AND lp.member_id = $2`,
    [classId, memberId]
  );
  return res.rows[0]?.completed || 0;
}

const lessonProgressRepository = {
  markComplete,
  countTotalLessonsByClass,
  countCompletedLessonsByMember,
};

export default lessonProgressRepository;