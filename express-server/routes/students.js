// Import dependencies
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const studentUtils = require('../utils/studentUtils');

const LESSON = 'Lesson';
const STUDENT = 'Student';
// MongoDB URL from the docker-compose file
const dbHost = 'mongodb://database/mean-docker';

const { generateDataToStudentLesson, setStudentData } = studentUtils;
// Connect to mongodb
mongoose.connect(dbHost);

// create mongoose schemas

const studentSchema = new mongoose.Schema({
  name: String,
  completedLessons: [
    {
      lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: LESSON,
      },
      completedDate: String,
    },
  ],
  completedLessonSize: {
    type: Number,
    default: 0,
  },
  studentRank: {
    type: Number,
    default: 0,
  },
  studentCompletedLessonPercentile: {
    type: Number,
    default: 0,
  },
  completedLessonsPercentile: {
    type: Number,
    default: 0,
  },
  totalLessons: {
    type: Number,
    default: 0,
  },
});

// create mongoose model
const Student = mongoose.model(STUDENT, studentSchema);

/* GET api listing. */
router.get('/', (req, res) => {
  res.send('api works');
});

/* GET all students. */
router.get('/students', (req, res) => {
  Student.find({})
    .populate('completedLessons.lessonId')
    .sort({ completedLessonSize: 1 })
    .exec(async (err, students) => {
      if (err) res.status(500).send(err);
      res.status(200).json(students);
    });
});

/* DELETE one student. */
router.delete('/students/:id', (req, res) => {
  Student.remove({ _id: req.params.id }, (err) => {
    if (err) res.status(500).send(error);
    updateStudentsRank();
    res.status(200).json({ deleted: true });
  });
});

/* GET one student. */
router.get('/students/:id', (req, res) => {
  Student.findById(req.params.id, (err, students) => {
    if (err) res.status(500).send(error);
    res.status(200).json(students);
  });
});

/* Create a student. */
router.post('/students', (req, res) => {
  let student = new Student({
    name: req.body.name,
  });

  student.save((error) => {
    if (error) res.status(500).send(error);

    res.status(201).json({
      message: 'Student created successfully',
    });
  });
});

router.put('/students/complete/:studentId', async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.studentId,
      completedLessons: { $elemMatch: { lessonId: req.body.lessonId } },
    });
    const result = await updateStudentsLessons(!!student, req);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

const updateStudentsRanking = async () => {
  const students = await Student.find({}).populate('completedLessons.lessonId').sort({ completedLessonSize: -1 });
  return Promise.all(
    students.map(async (student, key) => {
      const studentRank = key + 1;
      const { studentCompletedLessonPercentile, completedLessonsPercentile, totalLessons } = await setStudentData({
        ...student._doc,
        studentRank,
      });
      const { completedLessons } = student;
      const removeAllDeletedLesson = completedLessons
        .filter(({ lessonId }) => lessonId)
        .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));
      student.set({
        studentCompletedLessonPercentile,
        completedLessonsPercentile,
        totalLessons,
        studentRank,
        completedLessons: removeAllDeletedLesson,
        completedLessonSize: removeAllDeletedLesson.length,
      });
      const updatedData = await student.save();
      return updatedData;
    }),
  );
};

const updateStudentsLessons = async (isLessonComplete, req) => {
  const lessonId = req.body.lessonId;
  const { updateMethod, completedLessonSize, updatedData } = generateDataToStudentLesson(isLessonComplete, lessonId);
  await Student.findOneAndUpdate(
    { _id: req.params.studentId },
    {
      [updateMethod]: updatedData,
      $inc: { completedLessonSize },
    },
  );
  const newStudentValue = await updateStudentsRanking();
  return newStudentValue;
};

module.exports = router;
