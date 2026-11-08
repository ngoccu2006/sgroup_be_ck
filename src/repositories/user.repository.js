import db from '../configs/db.js';
import { buildPaginationSQL } from '../utils/pagination.js';

async function findAll(paginationParams) {
  const paginationSQL = buildPaginationSQL(paginationParams);
  const res = await db.query(
    `SELECT id, email, full_name, role, created_at, updated_at 
     FROM users 
     ${paginationSQL}`
  );
  return res.rows;
}

async function countAll() {
  const res = await db.query(`SELECT COUNT(*)::int AS total FROM users`);
  return res.rows[0].total;
}

async function findById(id) {
  const res = await db.query(
    `SELECT id, email, full_name, role, created_at, updated_at 
     FROM users 
     WHERE id = $1`,
    [id]
  );
  return res.rows[0]; // Trả về 1 đối tượng duy nhất
}

async function create(userData) {
  // Đón nhận trường password_hash đã được Service băm bảo mật
  const { id, email, full_name, role, password_hash } = userData;
  
  const res = await db.query(
    `INSERT INTO users (id, email, full_name, role, password_hash) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, email, full_name, role, created_at, updated_at`,
    [id, email, full_name, role || 'MEMBER', password_hash]
  );
  return res.rows[0];
}

async function update(id, userData) {
  const { email, full_name, role, password_hash } = userData;
  const res = await db.query(
    `UPDATE users 
     SET email = $1, full_name = $2, role = $3, password_hash = $4, updated_at = NOW() 
     WHERE id = $5 
     RETURNING id, email, full_name, role, created_at, updated_at`,
    [email, full_name, role, password_hash, id]
  );
  return res.rows[0];
}

async function remove(id) {
  const res = await db.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
  return res.rows[0];
}

const userRepository = {
  findAll,
  countAll,
  findById,
  create,
  update,
  remove
};

export default userRepository;
