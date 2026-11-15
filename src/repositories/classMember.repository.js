import db from '../configs/db.js';
import { buildPaginationSQL, buildClassMemberFilterSQL } from '../utils/pagination.js';

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

// Lấy danh sách tất cả học viên trong một lớp (có search, pagination)
async function findMembersByClassId(classId, paginationParams = {}) {
  const { whereClause, values } = buildClassMemberFilterSQL(classId, paginationParams, 1);
  const paginationSQL = paginationParams.sortBy ? buildPaginationSQL({
    ...paginationParams,
    sortBy: paginationParams.sortBy === 'full_name' ? 'u.full_name' 
          : paginationParams.sortBy === 'email' ? 'u.email'
          : paginationParams.sortBy === 'joined_at' ? 'cm.joined_at'
          : 'cm.joined_at',
    sortOrder: paginationParams.sortOrder || 'DESC',
  }) : buildPaginationSQL({ ...paginationParams, sortBy: 'cm.joined_at', sortOrder: 'DESC' });

  const res = await db.query(
    `SELECT cm.class_id, cm.joined_at, u.id as member_id, u.email, u.full_name, u.role
     FROM class_members cm
     JOIN users u ON cm.member_id = u.id
     ${whereClause}
     ${paginationSQL}`,
    values
  );
  return res.rows;
}

async function isMember(classId, memberId){
  const res = await db.query(
    `SELECT * FROM class_members WHERE class_id = $1 AND member_id = $2`,
    [classId, memberId]
  );
  return res.rows.length > 0;
}

// Đếm tổng số học viên trong lớp (có filter)
async function countMembersByClassId(classId, paginationParams = {}) {
  const { whereClause, values } = buildClassMemberFilterSQL(classId, paginationParams, 1);
  const res = await db.query(
    `SELECT COUNT(*)::int AS total 
     FROM class_members cm
     JOIN users u ON cm.member_id = u.id
     ${whereClause}`,
    values
  );
  return res.rows[0].total;
}

const classMemberRepository = {
  addMember,
  findMembersByClassId,
  isMember,
  countMembersByClassId
};

export default classMemberRepository;
