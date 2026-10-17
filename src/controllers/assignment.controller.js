import assignmentService from "../services/assignment.service.js";

async function createAssignment(req, res, next) {
  try{
    const assignment = await assignmentService.createAssignment(req.body, req.user.id);
    res.status(201).json({
      message: "Tao bai tap thanh cong",
      data: assignment
    });
  }catch(error){
    next(error); 
  }
}

async function getAssignmentsByClass(req, res, next) {
  try{
    const {classId} = req.params;
    const assigments = await assignmentService.getAssignmentsByClass(classId);
    res.status(200).json({
      data: assigments
    });
  } catch(error){
    next(error);
  }
}

async function getAssignmentById(req, res, next){
  try{
    const {id} = req.params;
    const assignment = await assignmentService.getAssignmentById(id);
    res.status(200).json({
      data: assignment
    });
  } catch(error){
    next(error);
  }
}

async function updateAssignment(req, res, next) {
  try{
    const {id} = req.params;
    const update = await assignmentService.updateAssignment(id, req.body);
    res.status(200).json({
      message: "Cap nhat bai tap thanh cong",
      data: update
    });
  } catch(error){
    next(error);
  }
}

async function deleteAssignment(req, res, next) {
  try{
    const {id} = req.params;
    await assignmentService.deleteAssignment(id);
    res.status(200).json({
      message: "Xoa bai tap thanh cong"
    });
  } catch(error){
    next(error);
  }
}


const assignmentController = {
  createAssignment,
  getAssignmentsByClass,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
};

export default assignmentController;