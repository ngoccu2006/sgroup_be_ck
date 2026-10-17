import {v4 as uuidv4} from 'uuid';
import assignmentRepository from '../repositories/assignment.repository.js';

async function createAssignment(assignmentData, currentUserId) {
  const newAssignment = {
    id: uuidv4(),
    ...assignmentData,
    created_by: currentUserId,
  };
  return await assignmentRepository.create(newAssignment);
}

async function getAssignmentsByClass(classId) {
  return await assignmentRepository.findByClassId(classId);
}

async function getAssignmentById(id){
  const assignment = await assignmentRepository.findById(id);
  if (!assignment) {
    const error = new Error('Bai tap khong ton tai');
    error.status = 404;
    throw error;
  }
  return assignment;
}

async function updateAssignment(id, updateData) {
  await getAssignmentById(id); // Check if assignment exists
  return await assignmentRepository.update(id, updateData);
}

async function deleteAssignment(id) {
  await getAssignmentById(id); // Check if assignment exists
  return await assignmentRepository.deleteById(id);
}

const assignmentService = {
  createAssignment,
  getAssignmentsByClass,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};

export default assignmentService;