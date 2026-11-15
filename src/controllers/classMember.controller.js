import classMemberService from "../services/classMember.service.js";
import { parsePaginationParams } from '../utils/pagination.js';

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
    const paginationParams = parsePaginationParams(req.query, {
      allowedSortFields: ['joined_at', 'full_name', 'email'],
      defaultSortBy: 'joined_at',
      defaultSortOrder: 'DESC',
    });

    const { members, pagination } = await classMemberService.getMembersInClass(classId, paginationParams);
    res.status(200).json({
      data: members,
      pagination
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
