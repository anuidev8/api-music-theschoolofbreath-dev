// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewer: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number'
    }
  },
  text: {
    type: String,
    maxLength: 1000
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Add these methods to calculate ratings on demand
reviewSchema.statics.getCourseStats = async function(courseId) {
    return this.aggregate([
      { $match: { courseId: mongoose.Types.ObjectId(courseId) } },
      { 
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 },
          distribution: {
            $push: '$rating'
          }
        }
      }
    ]);
  };

module.exports = mongoose.model('Review', reviewSchema);