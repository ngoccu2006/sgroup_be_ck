import { v4 as uuidv4 } from "uuid";
import lessonProgressRepository from "../repositories/lessonProgress.repository.js";

async function completeLesson(lessonId, memberId) {
  const id = uuidv4();
  return await lessonProgressRepository.markComplete(id, lessonId, memberId);
}

async function getClassProgress(classId, memberId) {
  const totalLessons = await lessonProgressRepository.countTotalLessonsByClass(classId);
  const completedLessons = await lessonProgressRepository.countCompletedLessonsByMember(classId, memberId);

  const progressPercentage = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  return {
    totalLessons,
    completedLessons,
    progress: progressPercentage,
  };
}

const lessonProgressService = {
  completeLesson,
  getClassProgress,
};

export default lessonProgressService;