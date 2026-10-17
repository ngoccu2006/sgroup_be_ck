import classRepository from "../repositories/class.repository.js";

async function createClass(classData) {
  return await classRepository.create(classData);
}

async function getAllClasses() {
  return await classRepository.findAll();
}

const classService = {
  createClass,
  getAllClasses
}

export default classService;