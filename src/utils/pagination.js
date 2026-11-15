/**
 * Utility phân trang, sắp xếp, lọc và tìm kiếm (Pagination, Sorting, Filtering & Search)
 * 
 * Response format:
 *   { items: [...], total, page, limit, totalPages, data: [...], pagination: { ... } }
 */

/**
 * Parse và validate các tham số pagination, sorting, search, filter
 */
export function parsePaginationParams(query, options = {}) {
  const {
    allowedSortFields = ['created_at'],
    defaultSortBy = 'created_at',
    defaultSortOrder = 'DESC',
    defaultLimit = 10,
    maxLimit = 100,
  } = options;

  // 1. Pagination: page & limit
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) page = 1;

  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const offset = (page - 1) * limit;

  // 2. Sorting: sortBy & order
  let sortBy = (query.sortBy || '').trim();
  if (!sortBy || !allowedSortFields.includes(sortBy)) {
    sortBy = defaultSortBy;
  }

  const rawOrder = (query.order || query.sortOrder || defaultSortOrder).toString().toUpperCase().trim();
  const sortOrder = (rawOrder === 'ASC' || rawOrder === 'DESC') ? rawOrder : defaultSortOrder;

  // 3. Search: q
  const q = typeof query.q === 'string' ? query.q.trim() : '';

  // 4. Filtering: fromDate & toDate
  const fromDate = typeof query.fromDate === 'string' && query.fromDate.trim() ? query.fromDate.trim() : null;
  const toDate = typeof query.toDate === 'string' && query.toDate.trim() ? query.toDate.trim() : null;

  if (fromDate && isNaN(Date.parse(fromDate))) {
    const error = new Error('Tham số fromDate không đúng định dạng ngày hợp lệ (YYYY-MM-DD)');
    error.statusCode = 400;
    throw error;
  }

  if (toDate && isNaN(Date.parse(toDate))) {
    const error = new Error('Tham số toDate không đúng định dạng ngày hợp lệ (YYYY-MM-DD)');
    error.statusCode = 400;
    throw error;
  }

  return {
    page,
    limit,
    offset,
    sortBy,
    sortOrder,
    q,
    fromDate,
    toDate,
  };
}

/**
 * Xây dựng mệnh đề WHERE có tham số hóa ($1, $2...) cho search và filter của Classes
 */
export function buildClassFilterSQL(params, initialParamIndex = 1) {
  const { q, fromDate, toDate } = params;
  const conditions = [];
  const values = [];
  let paramIndex = initialParamIndex;

  // Search theo name hoặc description
  if (q) {
    conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    values.push(`%${q}%`);
    paramIndex++;
  }

  // Filter theo khoảng ngày bắt đầu (start_date)
  if (fromDate) {
    conditions.push(`start_date >= $${paramIndex}`);
    values.push(fromDate);
    paramIndex++;
  }

  if (toDate) {
    conditions.push(`start_date <= $${paramIndex}`);
    values.push(toDate);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, values, nextParamIndex: paramIndex };
}

/**
 * Xây dựng WHERE cho Users: search theo full_name/email, filter theo role
 */
export function buildUserFilterSQL(params, initialParamIndex = 1) {
  const { q, role } = params;
  const conditions = [];
  const values = [];
  let paramIndex = initialParamIndex;

  if (q) {
    conditions.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    values.push(`%${q}%`);
    paramIndex++;
  }

  if (role && role !== 'ALL') {
    conditions.push(`role = $${paramIndex}`);
    values.push(role);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, values, nextParamIndex: paramIndex };
}

/**
 * Xây dựng WHERE cho Assignments: luôn filter theo class_id, search theo title/description, filter theo deadline
 */
export function buildAssignmentFilterSQL(classId, params, initialParamIndex = 1) {
  const { q, fromDate, toDate } = params;
  const conditions = [];
  const values = [];
  let paramIndex = initialParamIndex;

  // Luôn filter theo class_id
  conditions.push(`class_id = $${paramIndex}`);
  values.push(classId);
  paramIndex++;

  if (q) {
    conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    values.push(`%${q}%`);
    paramIndex++;
  }

  if (fromDate) {
    conditions.push(`deadline >= $${paramIndex}`);
    values.push(fromDate);
    paramIndex++;
  }

  if (toDate) {
    conditions.push(`deadline <= $${paramIndex}`);
    values.push(toDate);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, values, nextParamIndex: paramIndex };
}

/**
 * Xây dựng WHERE cho Lessons: luôn filter theo class_id, search theo title/content
 */
export function buildLessonFilterSQL(classId, params, initialParamIndex = 1) {
  const { q } = params;
  const conditions = [];
  const values = [];
  let paramIndex = initialParamIndex;

  conditions.push(`class_id = $${paramIndex}`);
  values.push(classId);
  paramIndex++;

  if (q) {
    conditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
    values.push(`%${q}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, values, nextParamIndex: paramIndex };
}

/**
 * Xây dựng WHERE cho Submissions: luôn filter theo assignment_id, search theo member_name/member_email, filter theo trạng thái chấm điểm
 */
export function buildSubmissionFilterSQL(assignmentId, params, initialParamIndex = 1) {
  const { q, status } = params;
  const conditions = [];
  const values = [];
  let paramIndex = initialParamIndex;

  conditions.push(`s.assignment_id = $${paramIndex}`);
  values.push(assignmentId);
  paramIndex++;

  if (q) {
    conditions.push(`(u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
    values.push(`%${q}%`);
    paramIndex++;
  }

  // Filter theo trạng thái: GRADED hoặc PENDING
  if (status === 'GRADED') {
    conditions.push(`s.score IS NOT NULL`);
  } else if (status === 'PENDING') {
    conditions.push(`s.score IS NULL`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, values, nextParamIndex: paramIndex };
}

/**
 * Xây dựng WHERE cho Notifications: luôn filter theo user_id, search theo title/message, filter theo is_read
 */
export function buildNotificationFilterSQL(userId, params, initialParamIndex = 1) {
  const { q, isRead } = params;
  const conditions = [];
  const values = [];
  let paramIndex = initialParamIndex;

  conditions.push(`user_id = $${paramIndex}`);
  values.push(userId);
  paramIndex++;

  if (q) {
    conditions.push(`(title ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`);
    values.push(`%${q}%`);
    paramIndex++;
  }

  if (isRead === 'true') {
    conditions.push(`is_read = TRUE`);
  } else if (isRead === 'false') {
    conditions.push(`is_read = FALSE`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, values, nextParamIndex: paramIndex };
}

/**
 * Xây dựng WHERE cho ClassMembers: luôn filter theo class_id, search theo full_name/email
 */
export function buildClassMemberFilterSQL(classId, params, initialParamIndex = 1) {
  const { q } = params;
  const conditions = [];
  const values = [];
  let paramIndex = initialParamIndex;

  conditions.push(`cm.class_id = $${paramIndex}`);
  values.push(classId);
  paramIndex++;

  if (q) {
    conditions.push(`(u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
    values.push(`%${q}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, values, nextParamIndex: paramIndex };
}

/**
 * Build phần ORDER BY ... LIMIT ... OFFSET
 */
export function buildPaginationSQL(params) {
  const { sortBy, sortOrder, limit, offset } = params;
  let orderColumn = sortBy || 'created_at';
  if (orderColumn.includes('.')) {
    const parts = orderColumn.split('.');
    orderColumn = `${parts[0]}."${parts.slice(1).join('.')}"`;
  } else {
    orderColumn = `"${orderColumn}"`;
  }
  return `ORDER BY ${orderColumn} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Tạo metadata phản hồi phân trang
 */
export function buildPaginationMeta(page, limit, totalItems) {
  const total = Number(totalItems) || 0;
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  return {
    page,
    limit,
    total,
    totalPages,
    // Tương thích ngược:
    totalItems: total,
  };
}


