import submissionService from "../services/submission.service.js";
import { uploadFileToR2 } from "../utils/r2Upload.js";

async function submitAssignment(req, res, next) {
  try {
    let fileUrl = req.body.file_url || null;

    if (req.file){
      const uploadResult = await uploadFileToR2(req.file, "submissions");
      fileUrl = uploadResult.fileUrl;
    }

    const submissionData = {
      assignment_id: req.body.assignment_id,
      content: req.body.content || null,
      repository_url: req.body.repository_url || null, // Link GitHub
      file_url: fileUrl,                              // Link File R2
    };

    const submission = await submissionService.submitAssignment(submissionData, req.user.id);
    res.status(200).json({ message: "Nộp bài tập thành công!", data: submission });
  } catch (error) {
    next(error);
  }
}

async function getMySubmission(req, res, next) {
  try {
    const { assignmentId } = req.params;
    const submission = await submissionService.getMySubmission(assignmentId, req.user.id);
    res.status(200).json({ data: submission });
  } catch (error) {
    next(error);
  }
}

async function getSubmissionsByAssignment(req, res, next) {
  try {
    const { assignmentId } = req.params;
    const submissions = await submissionService.getSubmissionsByAssignment(assignmentId);
    res.status(200).json({ data: submissions });
  } catch (error) {
    next(error);
  }
}

async function gradeSubmission(req, res, next) {
  try {
    const { id } = req.params;
    const { score, feedback } = req.body;
    const graded = await submissionService.gradeSubmission(id, score, feedback);
    res.status(200).json({ message: "Chấm điểm thành công!", data: graded });
  } catch (error) {
    next(error);
  }
}

const submissionController = {
  submitAssignment,
  getMySubmission,
  getSubmissionsByAssignment,
  gradeSubmission,
};

export default submissionController;