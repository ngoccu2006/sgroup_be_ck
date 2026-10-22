import db from "../configs/db.js";

// 1. Thống kê tổng quan danh sách bài tập trong lớp & tỷ lệ nộp bài
async function getAssignmentsSummaryByClass(classId) {
  const query = `
    SELECT 
      a.id AS assignment_id,
      a.title AS assignment_title,
      a.deadline,
      a.maximum_score,
      COUNT(DISTINCT cm.member_id) FILTER (WHERE u.role = 'MEMBER') AS total_members,
      COUNT(DISTINCT s.member_id) AS submitted_count,
      (COUNT(DISTINCT cm.member_id) FILTER (WHERE u.role = 'MEMBER') - COUNT(DISTINCT s.member_id)) AS unsubmitted_count,
      COUNT(DISTINCT s.id) FILTER (WHERE s.score IS NOT NULL) AS graded_count
    FROM assignments a
    JOIN class_members cm ON cm.class_id = a.class_id
    JOIN users u ON cm.member_id = u.id
    LEFT JOIN submissions s ON s.assignment_id = a.id
    WHERE a.class_id = $1
    GROUP BY a.id, a.title, a.deadline, a.maximum_score
    ORDER BY a.deadline ASC;
  `;
  const res = await db.query(query, [classId]);
  return res.rows;
}

// 2. Tính điểm trung bình (GPA) & thống kê bài nộp của từng Member trong lớp
async function getMembersGpaByClass(classId) {
  const query = `
    SELECT 
      u.id AS member_id,
      u.full_name,
      u.email,
      COUNT(DISTINCT a.id) AS total_assignments,
      COUNT(DISTINCT s.id) AS submitted_assignments,
      ROUND(AVG(s.score)::numeric, 2) AS gpa
    FROM class_members cm
    JOIN users u ON cm.member_id = u.id
    CROSS JOIN assignments a
    LEFT JOIN submissions s ON s.assignment_id = a.id AND s.member_id = u.id
    WHERE cm.class_id = $1 AND u.role = 'MEMBER' AND a.class_id = $1
    GROUP BY u.id, u.full_name, u.email
    ORDER BY gpa DESC NULLS LAST, u.full_name ASC;
  `;
  const res = await db.query(query, [classId]);
  return res.rows;
}

// 3. Lấy ma trận bảng điểm chi tiết của tất cả Member trong lớp (Phục vụ xuất Excel)
async function getClassGradeMatrix(classId) {
  const query = `
    SELECT 
      u.id AS member_id,
      u.full_name,
      u.email,
      a.id AS assignment_id,
      a.title AS assignment_title,
      s.score
    FROM class_members cm
    JOIN users u ON cm.member_id = u.id
    JOIN assignments a ON a.class_id = cm.class_id
    LEFT JOIN submissions s ON s.assignment_id = a.id AND s.member_id = u.id
    WHERE cm.class_id = $1 AND u.role = 'MEMBER'
    ORDER BY u.full_name, a.deadline ASC;
  `;
  const res = await db.query(query, [classId]);
  return res.rows;
}

const analyticsRepository = {
  getAssignmentsSummaryByClass,
  getMembersGpaByClass,
  getClassGradeMatrix,
};

export default analyticsRepository;