import classService from "../services/class.service.js";
import { parsePaginationParams } from '../utils/pagination.js';

async function createClass(req, res, next) {
  try{
    const newClass = await classService.createClass(req.body);
    res.status(201).json({
      message: 'Tao lop hoc thanh cong',
      data: newClass
    });
  } catch(error){
    res.status(400).json({ message: error.message})
  }
}

async function getAllClasses(req, res, next) {
  try{
    const paginationParams = parsePaginationParams(req.query, {
      allowedSortFields: ['created_at', 'name', 'start_date', 'end_date', 'updated_at'],
      defaultSortBy: 'created_at',
      defaultSortOrder: 'DESC',
    });
    const { classes, pagination } = await classService.getAllClasses(paginationParams);
    res.status(200).json({ data: classes, pagination });
  } catch(error){
    next(error)
  }
}


const classController = {
  createClass,
  getAllClasses
}

export default classController;