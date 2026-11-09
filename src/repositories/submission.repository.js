import db from "../configs/db.js";
import { buildPaginationSQL } from '../utils/pagination.js';

// 1. Member nộp bài hoặc cập nhật bài nộp (Upsert nếu đã tồn tại UNIQUE assignment_id + member_id)
// Nộp lại: lưu bản cũ vào submission_history, tăng version, reset điểm/feedback (trong 1 transaction)
async function upsert(submissionData) {
  const { id, assignment_id, member_id, content, repository_url, file_url } = submissionData;
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // Khóa dòng cũ (nếu có) để tránh 2 request nộp đồng thời
    const existing = (await client.query(
      `SELECT * FROM submissions WHERE assignment_id = $1 AND member_id = $2 FOR UPDATE;`,
      [assignment_id, member_id]
    )).rows[0];

    let result;
    if (existing) {
      await client.query(
        `INSERT INTO submission_history
           (submission_id, version, content, repository_url, file_url, score, feedback, submitted_at, reviewed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [existing.id, existing.version, existing.content, existing.repository_url, existing.file_url,
         existing.score, existing.feedback, existing.submitted_at, existing.reviewed_at]
      );
      result = (await client.query(
        `UPDATE submissions SET
           content = $1, repository_url = $2, file_url = $3,
           submitted_at = CURRENT_TIMESTAMP,
           version = version + 1,
           score = NULL, feedback = NULL, reviewed_at = NULL
         WHERE id = $4
         RETURNING *;`,
        [content, repository_url, file_url, existing.id]
      )).rows[0];
    } else {
      result = (await client.query(
        `INSERT INTO submissions (id, assignment_id, member_id, content, repository_url, file_url, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         RETURNING *;`,
        [id, assignment_id, member_id, content, repository_url, file_url]
      )).rows[0];
    }

    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Lịch sử các lần nộp trước đó của 1 submission (mới nhất trước)
async function findHistoryBySubmissionId(submissionId) {
  const res = await db.query(
    `SELECT * FROM submission_history WHERE submission_id = $1 ORDER BY version DESC;`,
    [submissionId]
  );
  return res.rows;
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
async function findByAssignmentId(assignmentId, paginationParams) {
  const paginationSQL = buildPaginationSQL(paginationParams);
  const query = `
    SELECT s.*, u.full_name as member_name, u.email as member_email
    FROM submissions s
    JOIN users u ON s.member_id = u.id
    WHERE s.assignment_id = $1
    ${paginationSQL};
  `;
  const res = await db.query(query, [assignmentId]);
  return res.rows;
}

// Đếm tổng số submissions theo assignment
async function countByAssignmentId(assignmentId) {
  const query = `SELECT COUNT(*)::int AS total FROM submissions WHERE assignment_id = $1`;
  const res = await db.query(query, [assignmentId]);
  return res.rows[0].total;
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
  findHistoryBySubmissionId,
  findByAssignmentAndMember,
  findByAssignmentId,
  countByAssignmentId,
  findById,
  updateGrade,
};

export default submissionRepository;