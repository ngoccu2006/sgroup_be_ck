import db from '../configs/db.js';

// Thêm học viên vào lớp
async function addMember(classId, memberId) {
  const res = await db.query(
    `INSERT INTO class_members (class_id, member_id) 
     VALUES ($1, $2) 
     RETURNING class_id, member_id, joined_at`,
    [classId, memberId]
  );
  return res.rows[0];
}

// Lấy danh sách tất cả học viên trong một lớp (Dùng câu lệnh JOIN để lấy thêm tên và email học viên)
async function findMembersByClassId(classId) {
  const res = await db.query(
    `SELECT cm.class_id, cm.joined_at, u.id as member_id, u.email, u.full_name, u.role
     FROM class_members cm
     JOIN users u ON cm.member_id = u.id
     WHERE cm.class_id = $1`,
    [classId]
  );
  return res.rows;
}

const classMemberRepository = {
  addMember,
  findMembersByClassId
};

export default classMemberRepository;