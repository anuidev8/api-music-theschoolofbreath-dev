const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  lessonId: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  lastWatched: {
    type: Date,
    default: null
  },
  watchTimeInSeconds: {
    type: Number,
    default: 0
  }
});

const sectionProgressSchema = new mongoose.Schema({
  sectionId: {
    type: String,
    required: true
  },
  lessonsProgress: [lessonProgressSchema]
});

const courseProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  lastAccessDate: {
    type: Date,
    default: Date.now
  },
  sectionsProgress: [sectionProgressSchema],
  completionPercentage: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Method to update completion percentage
courseProgressSchema.methods.updateCompletionPercentage = function() {
  let totalLessons = 0;
  let completedLessons = 0;

  this.sectionsProgress.forEach(section => {
    totalLessons += section.lessonsProgress.length;
    completedLessons += section.lessonsProgress.filter(lesson => lesson.completed).length;
  });

  this.completionPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  this.isCompleted = this.completionPercentage === 100;
};

// Method to mark a lesson as completed
courseProgressSchema.methods.markLessonAsCompleted = async function(sectionId, lessonId) {
  const section = this.sectionsProgress.find(s => s.sectionId === sectionId);
  if (section) {
    const lesson = section.lessonsProgress.find(l => l.lessonId === lessonId);
    if (lesson) {
      lesson.completed = true;
      lesson.lastWatched = new Date();
    }
  }
  this.updateCompletionPercentage();
  await this.save();
};

// Method to update lesson watch time
courseProgressSchema.methods.updateLessonWatchTime = async function(sectionId, lessonId, seconds) {
  const section = this.sectionsProgress.find(s => s.sectionId === sectionId);
  if (section) {
    const lesson = section.lessonsProgress.find(l => l.lessonId === lessonId);
    if (lesson) {
      lesson.watchTimeInSeconds = seconds;
      lesson.lastWatched = new Date();
    }
  }
  this.lastAccessDate = new Date();
  await this.save();
};

module.exports = mongoose.model('CourseProgress', courseProgressSchema);