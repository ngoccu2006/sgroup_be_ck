import classMemberService from "../services/classMember.service.js";

async function addMemberToClass(req, res, next) {
  try{
    const {class_id, member_id} = req.body;

    if(!class_id || !member_id){
      return res.status(400).json({ message: 'Thieu class_id hoac member_id'});
    }

    const result = await classMemberService.addMemberToClass(class_id, member_id);

    res.status(201).json({
      message: 'Them hoc vien vao lop thanh cong',
      data: result
    });
  } catch(error){
    res.status(400).json({ message: error.message});
  }
}

async function getMembersInClass(req, res, next) {
  try{
    const {classId } = req.params;
    const members = await classMemberService.getMembersInClass(classId);
    res.status(200).json({
      data: members
    });
  } catch(error){
    next(error);
  }
}

const classMemberController = {
  addMemberToClass,
  getMembersInClass
}

export default classMemberController;