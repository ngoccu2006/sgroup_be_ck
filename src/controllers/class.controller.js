import classService from "../services/class.service.js";

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
    const classes = await classService.getAllClasses();
    res.status(200).json({ data: classes});
  } catch(error){
    next(error)
  }
}


const classController = {
  createClass,
  getAllClasses
}

export default classController;