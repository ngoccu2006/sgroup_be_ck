import db from '../configs/db.js';

async function findByEmail(email) {
  const res = await db.query(
    `SELECT id, email, password_hash, full_name, role 
     FROM users 
     WHERE email = $1`,
    [email]
  );
  return res.rows[0]; // Trả về thông tin user (bao gồm password_hash để tí nữa so sánh)
}

const authRepository = {
  findByEmail
};

export default authRepository;
