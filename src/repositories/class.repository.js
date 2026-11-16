import db from '../configs/db.js';
import { buildPaginationSQL, buildClassFilterSQL } from '../utils/pagination.js';

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

async function update(id, classData) {
  const { name, description, start_date, end_date, mentor_id } = classData;
  const res = await db.query(
    `UPDATE classes
    SET name = $1, description = $2, start_date = $3, end_date = $4, mentor_id = $5, updated_at = NOW()
    WHERE id = $6
    RETURNING id, name, description, start_date, end_date, mentor_id, created_at, updated_at`,
    [name, description, start_date, end_date, mentor_id || null, id]
  );
  return res.rows[0];
}

async function deleteClass(id) {
  const res = await db.query(`DELETE FROM classes WHERE id = $1 RETURNING *`, [id]);
  return res.rows[0];
}

async function findAll(paginationParams) {
  const { whereClause, values, nextParamIndex } = buildClassFilterSQL(paginationParams, 1);
  const paginationSQL = buildPaginationSQL({
    sortBy: paginationParams.sortBy,
    sortOrder: paginationParams.sortOrder,
    limit: paginationParams.limit,
    offset: paginationParams.offset,
  });

  const query = `
    SELECT id, name, description, start_date, end_date, mentor_id, created_at, updated_at 
    FROM classes 
    ${whereClause} 
    ${paginationSQL}
  `;
  const res = await db.query(query, values);
  return res.rows;
}

async function countAll(paginationParams = {}) {
  const { whereClause, values } = buildClassFilterSQL(paginationParams, 1);
  const query = `SELECT COUNT(*)::int AS total FROM classes ${whereClause}`;
  const res = await db.query(query, values);
  return res.rows[0].total;
}

async function findById(id) {
  const res = await db.query(`SELECT * FROM classes WHERE id = $1`, [id]);
  return res.rows[0];
}

const classRepository = {
  create,
  findAll,
  countAll,
  findById,
  update,
  deleteClass
};

export default classRepository;