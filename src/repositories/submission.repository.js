import db from "../configs/db.js";

// 1. Member nộp bài hoặc cập nhật bài nộp (Upsert nếu đã tồn tại UNIQUE assignment_id + member_id)
async function upsert(submissionData) {
  const { id, assignment_id, member_id, content, repository_url, file_url } = submissionData;
  const query = `
    INSERT INTO submissions (id, assignment_id, member_id, content, repository_url, file_url, submitted_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    ON CONFLICT (assignment_id, member_id) 
    DO UPDATE SET 
      content = EXCLUDED.content,
      repository_url = EXCLUDED.repository_url,
      file_url = EXCLUDED.file_url,
      submitted_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const values = [id, assignment_id, member_id, content, repository_url, file_url];
  const res = await db.query(query, values);
  return res.rows[0];
}

// 2. Member xem bài nộp của chính mình theo assignment_id
async function findByAssignmentAndMember(assignmentId, memberId) {
  const query = `
    SELECT * FROM submissions 
    WHERE assignment_id = $1 AND member_id = $2;
  `;
  const res = await db.query(query, [assignmentId, memberId]);
  return res.rows[0];
}

// 3. Mentor xem danh sách tất cả bài nộp của 1 assignment (Join với bảng users để lấy tên Member)
async function findByAssignmentId(assignmentId) {
  const query = `
    SELECT s.*, u.full_name as member_name, u.email as member_email
    FROM submissions s
    JOIN users u ON s.member_id = u.id
    WHERE s.assignment_id = $1
    ORDER BY s.submitted_at DESC;
  `;
  const res = await db.query(query, [assignmentId]);
  return res.rows;
}

// 4. Tìm submission theo ID
async function findById(id) {
  const query = `SELECT * FROM submissions WHERE id = $1;`;
  const res = await db.query(query, [id]);
  return res.rows[0];
}

// 5. Mentor chấm điểm và feedback
async function updateGrade(id, score, feedback) {
  const query = `
    UPDATE submissions
    SET score = $1,
        feedback = $2,
        reviewed_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *;
  `;
  const res = await db.query(query, [score, feedback, id]);
  return res.rows[0];
}

const submissionRepository = {
  upsert,
  findByAssignmentAndMember,
  findByAssignmentId,
  findById,
  updateGrade,
};

export default submissionRepository;