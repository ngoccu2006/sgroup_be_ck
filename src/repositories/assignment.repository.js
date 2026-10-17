import db from "../configs/db.js";

// tao assignment

async function create(assignmentData){

  const {id, class_id, title, description, deadline, maximum_score, created_by} = assignmentData;
  const query = `
    INSERT INTO assignments (id, class_id, title, description, deadline, maximum_score, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [id, class_id, title, description, deadline, maximum_score || 10, created_by];

  const res = await db.query(query, values);
  return res.rows[0];
}

// lay danh sach assignment theo lớp
async function findByClassId(classId){
  const query = `
    SELECT * FROM assignments
    WHERE class_id = $1
    ORDER BY created_at ASC;
  `;
  const res = await db.query(query, [classId]);
  return res.rows;
}

// tim assignment theo id
async function findById(id){
  const query = `SELECT * FROM assignments WHERE id = $1`;
  const res = await db.query(query, [id]);
  return res.rows[0];
}

// cap nhat assignment , id : la id cua assignment
async function update(id, updateData){
  const {title, description, deadline, maximum_score} = updateData;
  const query = `
    UPDATE assignments
    SET title = COALESCE($1, title),
        description = COALESCE($2, description),
        deadline = COALESCE($3, deadline),
        maximum_score = COALESCE($4, maximum_score)
    WHERE id = $5
    RETURNING *;
  `;
  const values = [title, description, deadline, maximum_score, id];
  const res = await db.query(query, values);
  return res.rows[0];
}

// xoa assignment
async function deleteById(id){
  const query = `DELETE FROM assignments WHERE id = $1 RETURNING id;`;
  const res = await db.query(query, [id]);
  return res.rows[0];
}

const assignmentRepository = {
  create,
  findByClassId,
  findById,
  update,
  deleteById
};

export default assignmentRepository;