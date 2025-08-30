const mongoose = require('mongoose');

const breathworkCycleSchema = new mongoose.Schema({
  cycleNumber: {
    type: Number,
    required: true,
    unique: true
  },
  levelNumber: {
    type: Number,
    required: true
  },
  cycleInLevel: {
    type: Number,
    required: true
  },
  inhaleSeconds: {
    type: Number,
    required: true
  },
  holdSeconds: {
    type: Number,
    required: true
  },
  exhaleSeconds: {
    type: Number,
    required: true
  },
  totalSeconds: {
    type: Number,
    required: true
  },
  difficultyLevel: {
    type: Number,
    required: true
  },
  badgeInfo: {
    badgeName: {
      type: String,
      default: null
      // Removed enum to allow dynamic badge names
    },
    message: {
      type: String,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'breathworkCycles'
});

// Index for fast queries
breathworkCycleSchema.index({ cycleNumber: 1 });
breathworkCycleSchema.index({ levelNumber: 1 });
breathworkCycleSchema.index({ difficultyLevel: 1 });

// Virtual for cycle description
breathworkCycleSchema.virtual('cycleDescription').get(function() {
  return `Level ${this.levelNumber}, Cycle ${this.cycleInLevel} (Level ${this.difficultyLevel})`;
});

// Method to get timing as object
breathworkCycleSchema.methods.getTiming = function() {
  return {
    inhale: this.inhaleSeconds,
    hold: this.holdSeconds,
    exhale: this.exhaleSeconds,
    total: this.totalSeconds
  };
};

// Static method to get cycles by level
breathworkCycleSchema.statics.getCyclesByLevel = function(levelNumber) {
  return this.find({ levelNumber, isActive: true }).sort({ cycleInLevel: 1 });
};

// Static method to get cycles in range
breathworkCycleSchema.statics.getCyclesInRange = function(start, end) {
  return this.find({ 
    cycleNumber: { $gte: start, $lte: end },
    isActive: true 
  }).sort({ cycleNumber: 1 });
};

module.exports = mongoose.model('BreathworkCycle', breathworkCycleSchema); 