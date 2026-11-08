import db from "../configs/db.js"
import { buildPaginationSQL } from '../utils/pagination.js';

async function create(lessonData){
  const {id, class_id, title, content, order, created_by} = lessonData;

  const res = await db.query(
    ` INSERT INTO lessons (id, class_id, title, content, "order", created_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, class_id, title, content, "order", created_by, created_at`,
    [id, class_id, title, content, order, created_by]
  );

  return res.rows[0];
}

async function findByClassId(classId, paginationParams){
  const paginationSQL = buildPaginationSQL(paginationParams);
  const res = await db.query(
    `SELECT id, class_id, title, content, "order", created_by, created_at
    FROM lessons
    WHERE class_id = $1
    ${paginationSQL}`,
    [classId]
  );

  return res.rows;
}

async function countByClassId(classId) {
  const res = await db.query(
    `SELECT COUNT(*)::int AS total FROM lessons WHERE class_id = $1`,
    [classId]
  );
  return res.rows[0].total;
}

async function findByClassAndOrder(classId, order){
  const res = await db.query(
    'SELECT id FROM lessons WHERE class_id = $1 AND "order" = $2',
    [classId, order]
  );
  return res.rows[0];
}

const lessonRepository = {
  create,
  findByClassId,
  countByClassId,
  findByClassAndOrder
}

export default lessonRepository;