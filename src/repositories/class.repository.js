import db from '../configs/db.js';
import { buildPaginationSQL } from '../utils/pagination.js';

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

async function findAll(paginationParams) {
  const paginationSQL = buildPaginationSQL(paginationParams);
  const res = await db.query(`SELECT * FROM classes ${paginationSQL}`);
  return res.rows;
}

async function countAll() {
  const res = await db.query(`SELECT COUNT(*)::int AS total FROM classes`);
  return res.rows[0].total;
}

const classRepository = {
  create,
  findAll,
  countAll
};

export default classRepository;