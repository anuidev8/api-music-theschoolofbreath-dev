// models/Course.js
const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  id: String,
  title: String,
  videoUrl: {
    type: String,
    default: null
  },
  audioUrl: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['video', 'file','audio'],
    default: 'video'
  },
  isFromYoutube: {
    type: Boolean,
    default: false
  },
  file: String,
  isPremium: {
    type: Boolean,
    default: true  // By default, lessons are premium
  }
});

const sectionSchema = new mongoose.Schema({
  section: String,
  lessons: [lessonSchema],
  isPremium: {
    type: Boolean,
    default: true  // By default, sections are premium
  }
});


const authorSchema = new mongoose.Schema({
  name: String,
  bio: String,
  profileImage: String
});

const courseSchema = new mongoose.Schema({
   id: String, 
  systemeIoId: {
    type: String,
    sparse: true // Allows null/undefined values
  },
  creationMethod: {
    type: String,
    enum: ['fromScratch', 'fromSystemeio'],
    required: true
  },
  title: String,
  description: String,
  image: String,
  type: String,
  days: String,
  time: {
    type: String,
    default: 'Watch At your Own Pace'
  },
  order: {
    type: Number,
    default: 0
  },
  courseTheme: String,
  author: authorSchema,
  sections: [sectionSchema],
  accessTags: [{
    type: String,
    enum: [
      'Enrolled_Holistic Membership',
      'Enrolled_to_Sleep_Membership',
      'Purchased_9-Day Breathwork Course',
      'Purchased_9-Day Meditation Course',
      'Purchased_Swara_Yoga_Course',
      'Purchased_9-Day Bliss Course',
      'Purchased_12-Day ThirdEye Course',
      'Purchased_Kundalini Course'
    ]
  }]
}, {
  timestamps: true
});
// Add a virtual property for ratings
courseSchema.virtual('ratings').get(async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.getCourseStats(this._id);
  return stats[0] || { average: 0, count: 0, distribution: {} };
});
module.exports = mongoose.model('Course', courseSchema);