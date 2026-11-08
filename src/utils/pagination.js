/**
 * Utility phân trang và sắp xếp (Pagination & Sorting)
 * 
 * Sử dụng query params:
 *   ?page=1&limit=10&sortBy=created_at&sortOrder=DESC
 * 
 * Response format:
 *   { data: [...], pagination: { page, limit, totalItems, totalPages } }
 */

/**
 * Parse và validate các tham số pagination/sorting từ query params
 * @param {object} query - req.query object
 * @param {object} options - Cấu hình mặc định và các cột được phép sort
 * @param {string[]} options.allowedSortFields - Danh sách cột cho phép sort
 * @param {string} options.defaultSortBy - Cột sort mặc định
 * @param {string} options.defaultSortOrder - Thứ tự sort mặc định ('ASC' | 'DESC')
 * @param {number} options.defaultLimit - Số record mặc định mỗi trang
 * @param {number} options.maxLimit - Giới hạn tối đa records mỗi trang
 * @returns {{ page: number, limit: number, offset: number, sortBy: string, sortOrder: string }}
 */
export function parsePaginationParams(query, options = {}) {
  const {
    allowedSortFields = ['created_at'],
    defaultSortBy = 'created_at',
    defaultSortOrder = 'DESC',
    defaultLimit = 10,
    maxLimit = 100,
  } = options;

  // Parse page (tối thiểu là 1)
  let page = parseInt(query.page, 10);
  if (isNaN(page) || page < 1) page = 1;

  // Parse limit (tối thiểu 1, tối đa maxLimit)
  let limit = parseInt(query.limit, 10);
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  // Tính offset
  const offset = (page - 1) * limit;

  // Validate sortBy (chống SQL injection bằng whitelist)
  let sortBy = query.sortBy || defaultSortBy;
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = defaultSortBy;
  }

  // Validate sortOrder (chỉ cho phép ASC hoặc DESC)
  let sortOrder = (query.sortOrder || defaultSortOrder).toUpperCase();
  if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
    sortOrder = defaultSortOrder;
  }

  return { page, limit, offset, sortBy, sortOrder };
}

/**
 * Build phần ORDER BY ... LIMIT ... OFFSET cho câu SQL
 * sortBy được quote bằng dấu nháy kép để handle tên cột có keyword (vd: "order")
 * @param {{ sortBy: string, sortOrder: string, limit: number, offset: number }} params
 * @returns {string}
 */
export function buildPaginationSQL(params) {
  const { sortBy, sortOrder, limit, offset } = params;
  return `ORDER BY "${sortBy}" ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Tạo object pagination metadata cho response
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số records mỗi trang
 * @param {number} totalItems - Tổng số records
 * @returns {{ page: number, limit: number, totalItems: number, totalPages: number }}
 */
export function buildPaginationMeta(page, limit, totalItems) {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
}

