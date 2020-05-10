const mongoose = require('mongoose');

const LESSON = 'Lesson';
const STUDENT = 'Student';

const setStudentData = async ({ completedLessonSize, studentRank }) => {
  const lessonCount = await getDocumentCountInModel(LESSON);
  const studentCount = await getDocumentCountInModel(STUDENT);
  const studentCompletedLessonPercentile = studentRank
    ? await calculateStudentPercentile(studentRank, studentCount)
    : 0;
  const completedLessonsPercentile = studentRank
    ? await calculateCompletedLessonsPercentile(lessonCount, completedLessonSize)
    : 0;
  return {
    studentCompletedLessonPercentile,
    completedLessonsPercentile,
    totalLessons: lessonCount,
  };
};

const generateDataToStudentLesson = (isLessonComplete, lessonId) => ({
  updateMethod: isLessonComplete ? '$pull' : '$push',
  completedLessonSize: isLessonComplete ? -1 : 1,
  updatedData: isLessonComplete
    ? { completedLessons: { lessonId } }
    : { completedLessons: { lessonId, completedDate: new Date() } },
});

const calculateStudentPercentile = (studentRank, studentCount) =>
  ((studentCount - studentRank) / (studentCount - 1)) * 100;

const calculateCompletedLessonsPercentile = (lessonsCount, completedLessonSize) =>
  (completedLessonSize / lessonsCount) * 100;

const getDocumentCountInModel = (modelName) => mongoose.model(modelName).count({});

module.exports = {
  getDocumentCountInModel,
  calculateCompletedLessonsPercentile,
  calculateStudentPercentile,
  generateDataToStudentLesson,
  setStudentData,
};
