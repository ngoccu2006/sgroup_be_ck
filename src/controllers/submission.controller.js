import submissionService from "../services/submission.service.js";

async function submitAssignment(req, res, next) {
  try {
    const submission = await submissionService.submitAssignment(req.body, req.user.id);
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