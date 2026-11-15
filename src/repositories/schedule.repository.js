import db from '../configs/db.js';
import { buildPaginationSQL } from '../utils/pagination.js';

// ep kieu date ve text de k bi lech mui gio
const COLUMNS = `id, class_id, lesson_id, title, session_date::text AS session_date, start_time, end_time, location, note, created_by, created_at`;


async function create(data){
  const {id, class_id, lesson_id, title, session_date, start_time, end_time, location, note, created_by} = data;
  const res = await db.query(
    `INSERT INTO class_schedules (id, class_id, lesson_id, title, session_date, start_time, end_time, location, note, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING ${COLUMNS}`,
    [id, class_id, lesson_id || null, title, session_date, start_time, end_time, location || null, note || null, created_by]
  );
  return res.rows[0];
}

async function findByClassId(classId, paginationParams) {
  const paginationSQL = buildPaginationSQL(paginationParams);
  const res = await db.query(
    `SELECT ${COLUMNS} FROM class_schedules WHERE class_id = $1 ${paginationSQL}`,
    [classId]
  );
  return res.rows;
}

async function countByClassId(classId) {
  const res = await db.query(
    `SELECT COUNT(*)::int AS total FROM class_schedules WHERE class_id = $1`,
    [classId]
  );
  return res.rows[0].total;
}

async function findById(id) {
  const res = await db.query(
    `SELECT ${COLUMNS} FROM class_schedules WHERE id = $1`,
    [id]
  );
  return res.rows[0];
}

// tim buoi hocj trung gio trong cung 1 lop (neu co) de tranh trung lich
async function findOverlap(classId, sessionDate, startTime, endTime, excludeId = null) {
  const res = await db.query(
    `SELECT id, title FROM class_schedules
     WHERE class_id = $1
       AND session_date = $2
       AND start_time < $4
       AND end_time > $3
       AND ($5::varchar IS NULL OR id <> $5)
     LIMIT 1;`,
    [classId, sessionDate, startTime, endTime, excludeId]
  );
  return res.rows[0];
}

async function update(id, data){
  const {lesson_id, title, session_date, start_time, end_time, location, note} = data;
  const res = await db.query(
    `UPDATE class_schedules
    SET lesson_id = $1, title = $2, session_date = $3, start_time = $4, end_time = $5, location = $6, note = $7
    WHERE id = $8
    RETURNING ${COLUMNS}`,
    [lesson_id, title, session_date, start_time, end_time, location, note, id]
  );
  return res.rows[0];
}

async function remove(id){
  await db.query(`DELETE FROM class_schedules WHERE id = $1`, [id]);
}

const scheduleRepository = {
  create,
  findByClassId,
  countByClassId,
  findById,
  findOverlap,
  update,
  remove
};

export default scheduleRepository;