import classRepository from "../repositories/class.repository.js";
import {v4 as uuidv4} from 'uuid';

async function createClass(classData) {
  const newClass = {
    id: uuidv4(),
    ...classData,
  };
  return await classRepository.create(newClass);
}

async function getAllClasses() {
  return await classRepository.findAll();
}

const classService = {
  createClass,
  getAllClasses
}

export default classService;