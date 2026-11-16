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
      defaultLimit: 10,
    });
    const result = await classService.getAllClasses(paginationParams);
    res.status(200).json({
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      // Tương thích ngược:
      data: result.items,
      pagination: result.pagination,
    });
  } catch(error){
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function updateClass(req, res, next){
  try{
    const updatedClass = await classService.updateClass(req.params.id, req.body);
    res.status(200).json({
      message: 'Cập nhật lớp học thành công',
      data: updatedClass
    });
  } catch(error){
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

async function deleteClass(req, res, next){
  try{
    const deletedClass = await classService.deleteClass(req.params.id);
    res.status(200).json({
      message: 'Xóa lớp học thành công',
      data: deletedClass
    });
  } catch(error){
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

const classController = {
  createClass,
  getAllClasses,
  updateClass,
  deleteClass
}

export default classController;