import classRepository from "../repositories/class.repository.js";
import {v4 as uuidv4} from 'uuid';
import { buildPaginationMeta } from '../utils/pagination.js';

async function createClass(classData) {
  const newClass = {
    id: uuidv4(),
    ...classData,
  };
  return await classRepository.create(newClass);
}

async function getAllClasses(paginationParams) {
  const [classes, totalItems] = await Promise.all([
    classRepository.findAll(paginationParams),
    classRepository.countAll(paginationParams),
  ]);
  const pagination = buildPaginationMeta(paginationParams.page, paginationParams.limit, totalItems);

  // Xử lý trang vượt quá giới hạn: trả về danh sách rỗng, không báo lỗi
  const items = (totalItems > 0 && paginationParams.page > pagination.totalPages) ? [] : classes;

  return {
    items,
    total: pagination.total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: pagination.totalPages,
    // Tương thích ngược:
    classes: items,
    data: items,
    pagination,
  };
}

const classService = {
  createClass,
  getAllClasses
}

export default classService;