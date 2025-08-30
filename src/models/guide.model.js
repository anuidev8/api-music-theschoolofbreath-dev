const mongoose = require('mongoose');

// Schema for guide resources (flexible resource system)
const guideResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: 'Resource description'
  },
  image: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['gif', 'image', 'video', 'audio', 'other'],
    default: 'image'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
});

// Main guide schema
const guideSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    enum: ['abhi', 'ganesha']
  },
  name: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String,
    required: true
  },
  personality: {
    type: String,
    required: true,
    enum: ['modern', 'ancient', 'spiritual', 'practical']
  },
  systemPrompt: {
    type: String,
    required: true
  },
  resources: [guideResourceSchema],
  isActive: {
    type: Boolean,
    default: true
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

// Update timestamp on save
guideSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static methods
guideSchema.statics = {
  // Get all active guides
  getActiveGuides: function() {
    return this.find({ isActive: true }).sort({ name: 1 });
  },

  // Get guide by ID
  getGuideById: function(guideId) {
    return this.findOne({ id: guideId, isActive: true });
  },

  // Get guide resources
  getGuideResources: function(guideId) {
    return this.findOne({ id: guideId, isActive: true }, { resources: 1, name: 1 });
  },

  // Get specific resource by name
  getResourceByName: function(guideId, resourceName) {
    return this.findOne(
      { id: guideId, isActive: true, 'resources.name': resourceName },
      { 'resources.$': 1, name: 1 }
    );
  },

  // Get active resources only
  getActiveResources: function(guideId) {
    return this.findOne(
      { id: guideId, isActive: true },
      { resources: { $filter: { input: '$resources', cond: { $eq: ['$$this.isActive', true] } } }, name: 1 }
    );
  }
};

const Guide = mongoose.model('Guide', guideSchema);

module.exports = Guide; 