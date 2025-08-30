// controllers/review.controller.js
const Review = require('../models/review.model');
const Course = require('../models/courses.model');
const { default: axios } = require('axios');
const { default: mongoose } = require('mongoose');
const fullAccessTags = ['Enrolled_Holistic Membership'];
exports.createReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, text } = req.body;
    const userEmail = req.user.email;
    const fullName = req.user.fullName
    const userId = req.user._id
 // First, verify the course exists
 const course = await Course.findById(courseId);
 if (!course) {
   return res.status(404).json({ message: 'Course not found' });
 }
     // Get user tags from Systeme.io
     const response = await axios.get(`https://api.systeme.io/api/contacts?email=${userEmail}`, {
        headers: {
          'x-api-key': process.env.API_SYSTEME_KEY
        },
      });
  
      const contacts = response.data?.items[0] ?? null;
      const userTags = contacts ? contacts.tags.map(tag => tag.name) : [];
  
      // Check access using the same logic as getCourses
      const hasFullAccess = userTags.some(tag => fullAccessTags.includes(tag));
      const hasSpecificAccess = course.accessTags.some(tag => userTags.includes(tag));
      const hasAccess = hasFullAccess || hasSpecificAccess;
  
      if (!hasAccess) {
        return res.status(403).json({ message: 'Must purchase course to submit a review' });
      }
  
     

    // Create review
    const review = await Review.create({
      courseId,
      userId,
      reviewer:fullName,
      rating,
      text,
      isVerifiedPurchase: true,
      status: 'approved' // You might want to change this to 'pending' if you want manual approval
    });

    // Update course ratings
    await updateCourseRatings(courseId);

    res.status(201).json({ review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCourseRatings = async (courseId) => {
  const aggregation = await Review.aggregate([
    { $match: { courseId: mongoose.Types.ObjectId(courseId), status: 'approved' } },
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

  if (aggregation.length > 0) {
    const stats = aggregation[0];
    const distribution = stats.distribution.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    await Course.findByIdAndUpdate(courseId, {
      'ratings.average': Number(stats.average.toFixed(1)),
      'ratings.count': stats.count,
      'ratings.distribution': distribution
    });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, status = 'approved' } = req.query;

    const reviews = await Review.find({
      courseId,
      status
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Review.countDocuments({ courseId, status });

    res.status(200).json({
      reviews,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};