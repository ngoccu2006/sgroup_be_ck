import { v4 as uuidv4 } from "uuid";
import submissionRepository from "../repositories/submission.repository.js";
import assignmentRepository from "../repositories/assignment.repository.js";
import notificationService from "./notification.service.js";

async function submitAssignment(submissionData, currentMemberId) {
  const { assignment_id, content, repository_url, file_url} = submissionData;

  // kiem tra xem co nop bai thuoc 1 trong 3 hinh thuc tren khong
  if (!content && !repository_url && !file_url){
    const error = new Error("Bạn phải nhập nội dung, đính kèm link repository hoặc upload file bài làm!");
    error.statusCode = 400;
    throw error;
  }

  // Kiểm tra bài tập có tồn tại không
  const assignment = await assignmentRepository.findById(submissionData.assignment_id);
  if (!assignment) {
    const error = new Error("Bài tập không tồn tại!");
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra deadline (nếu có)
  if (assignment.deadline && new Date() > new Date(assignment.deadline)) {
    const error = new Error("Đã hết hạn nộp bài tập này!");
    error.statusCode = 400;
    throw error;
  }

  const newSubmission = {
    id: uuidv4(),
    ...submissionData,
    member_id: currentMemberId,
  };

  return await submissionRepository.upsert(newSubmission);
}

async function getMySubmission(assignmentId, currentMemberId) {
  const submission = await submissionRepository.findByAssignmentAndMember(assignmentId, currentMemberId);
  if (!submission) {
    const error = new Error("Bạn chưa nộp bài tập này!");
    error.statusCode = 404;
    throw error;
  }
  return submission;
}

async function getSubmissionsByAssignment(assignmentId) {
  return await submissionRepository.findByAssignmentId(assignmentId);
}

async function gradeSubmission(submissionId, score, feedback) {
  const submission = await submissionRepository.findById(submissionId);
  if (!submission) {
    const error = new Error("Bản ghi bài nộp không tồn tại!");
    error.statusCode = 404;
    throw error;
  }

  // Lấy thông tin bài tập để check điểm tối đa
  const assignment = await assignmentRepository.findById(submission.assignment_id);
  if (score < 0 || score > assignment.maximum_score) {
    const error = new Error(`Điểm số phải nằm trong khoảng từ 0 đến ${assignment.maximum_score}!`);
    error.statusCode = 400;
    throw error;
  }

  const updatedSubmission = await submissionRepository.updateGrade(submissionId, score, feedback);

  // gui thong bao
  await notificationService.sendNotificationToUser(
    submission.member_id,
    "Ket qua cham diem bai tap",
    `Bai tap "${assignment.title}" cua ban da duoc cham diem: ${score}/${assignment.maximum_score}` 
  );

  return updatedSubmission;
}

const submissionService = {
  submitAssignment,
  getMySubmission,
  getSubmissionsByAssignment,
  gradeSubmission,
};

export default submissionService;