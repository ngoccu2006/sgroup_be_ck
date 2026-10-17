import db from '../configs/db.js';

async function create(classData){
  const {id, name, description, start_date, end_date, mentor_id} = classData;
  const res = await db.query(
    `INSERT INTO classes (id, name, description, start_date, end_date, mentor_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, description, start_date, end_date, mentor_id, created_at, updated_at`,
    [id, name, description, start_date, end_date, mentor_id || null]
  );
  return res.rows[0];
}

async function findAll() {
  const res = await db.query(`SELECT * FROM classes ORDER BY created_at DESC`);
  return res.rows;
}

const classRepository = {
  create,
  findAll
};

export default classRepository;