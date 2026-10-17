import classMemberRepository from '../repositories/classMember.repository.js';

async function addMemberToClass(classId, memberId) {
  try {
    return await classMemberRepository.addMember(classId, memberId);
  } catch (error) {
    // Bắt lỗi trùng khóa chính (Unique/Primary key violation ở Postgres có mã code là '23505')
    if (error.code === '23505') {
      throw new Error('Học viên này đã tham gia lớp học này rồi!');
    }
    throw error;
  }
}

async function getMembersInClass(classId) {
  return await classMemberRepository.findMembersByClassId(classId);
}

const classMemberService = {
  addMemberToClass,
  getMembersInClass
};

export default classMemberService;
