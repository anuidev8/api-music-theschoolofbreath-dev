// models/faq.model.js
const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['general', 'membership', 'course', 'app', 'technical']
  },
  question: {
    type: String,
    required: true,

  },
  answer: {
    type: String,
    required: true
  },
  backgroundColor: {
    type: String,
    default: '#FFFFFF'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
faqSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const FAQ = mongoose.model('FAQ', faqSchema);

module.exports = FAQ;