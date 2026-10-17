import lessonProgressService from '../services/lessonProgress.service.js';


// post /lessons/:lessonId/complete
async function completeLesson(req, res, next){
  try{
    // muc tieu la danh dau hoan thanh bai hoc cua 1 member xac dinh
    // minh se can lay memberId tu xac thuc nguoi dung va lessonId tu tham so truyen

    const memberId = req.user.id;
    const {lessonId} = req.params;

    const result = await lessonProgressService.completeLesson(lessonId, memberId);

    res.status(200).json({
      message: "Da hoan thanh bai hoc",
      data: result
    });
  }catch(error){
    next(error);
  }
}

// get /classes/:classId/progress
async function getClassProgress(req, res, next){
  try{
    const {classId} = req.params;
    const memberId = req.user.id;

    const progress = await lessonProgressService.getClassProgress(classId, memberId);
    res.status(200).json({
      data: progress
    });

  }catch(error){
    next(error);
  }
}

const lessonProgressController = {
  completeLesson,
  getClassProgress
};

export default lessonProgressController;