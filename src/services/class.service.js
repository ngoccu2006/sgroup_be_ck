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
    classRepository.countAll(),
  ]);
  const pagination = buildPaginationMeta(paginationParams.page, paginationParams.limit, totalItems);
  return { classes, pagination };
}

const classService = {
  createClass,
  getAllClasses
}

export default classService;