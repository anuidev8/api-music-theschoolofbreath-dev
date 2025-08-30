// routes/review.routes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authorize } = require("../utils/auth");

router.post('/courses/:courseId', authorize(), reviewController.createReview);
router.get('/courses/:courseId', authorize(),reviewController.getReviews);

module.exports = router;