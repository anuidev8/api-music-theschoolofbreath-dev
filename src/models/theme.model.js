// models/Theme.js
const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  colors: {
    primaryColor: String,
    secondaryColor: String,
    backgroundColor: String,
    textColor: String,
    accentColor: String,
    headerColor: String,
    courseTitleColor: String,
    instructorTextColor: String,
    tabBackgroundColor: String,
    dayBackgroundColor: String,
    sectionBackgroundColor: String,
    subsectionBackgroundColor: String,
    lessonBackgroundColor: String,
    reviewBackgroundColor: String,
    descriptionColor: String
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Theme = mongoose.model('Theme', themeSchema);
module.exports = Theme;