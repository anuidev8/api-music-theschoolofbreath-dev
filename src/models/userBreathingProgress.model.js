const mongoose = require('mongoose');

const userBreathingProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Adaptive Challenge Progress
  adaptiveChallenge: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    currentLevel: {
      type: Number,
      default: 1,
      min: 1
    },
    currentCycleInLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 6
    },
    totalCyclesCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    lastSessionDate: {
      type: Date,
      default: Date.now
    },
    lastAdaptiveTiming: {
      inhale: {
        type: Number,
        default: 4.0,
        min: 1,
        max: 20
      },
      hold: {
        type: Number,
        default: 7.0,
        min: 1,
        max: 20
      },
      exhale: {
        type: Number,
        default: 8.0,
        min: 1,
        max: 20
      }
    },
    frozenDifficultyLevel: {
      type: Number,
      default: null,
      min: 1
    },
    badges: [{
      type: String,
      // Open-ended badge system - no enum restrictions
      // Badges can be any string, making the system completely dynamic
    }],
    achievements: {
      // Dynamic achievements - can be any key-value pairs
      // This allows for flexible achievement system
      type: Map,
      of: Boolean,
      default: new Map()
    },
    totalSessionsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPracticeTime: {
      type: Number,
      default: 0, // in seconds
      min: 0
    },
    longestSession: {
      type: Number,
      default: 0, // in cycles
      min: 0
    },
    currentStreak: {
      type: Number,
      default: 0, // consecutive days
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Custom Breathing Progress
  customBreathing: {
    isActive: {
      type: Boolean,
      default: false
    },
    customTimings: {
      inhale: {
        type: Number,
        default: 4.0,
        min: 1,
        max: 15
      },
      hold: {
        type: Number,
        default: 7.0,
        min: 1,
        max: 15
      },
      exhale: {
        type: Number,
        default: 8.0,
        min: 1,
        max: 15
      }
    },
    totalCustomCycles: {
      type: Number,
      default: 0,
      min: 0
    },
    lastModified: {
      type: Date,
      default: Date.now
    },
    isInheritedFromAdaptive: {
      type: Boolean,
      default: false
    },
    totalSessionsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPracticeTime: {
      type: Number,
      default: 0, // in seconds
      min: 0
    }
  },
  
  // Overall Progress Statistics
  overallStats: {
    totalSessionsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    totalCyclesCompleted: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPracticeTime: {
      type: Number,
      default: 0, // in seconds
      min: 0
    },
    firstSessionDate: {
      type: Date,
      default: Date.now
    },
    lastSessionDate: {
      type: Date,
      default: Date.now
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    averageSessionLength: {
      type: Number,
      default: 0, // in cycles
      min: 0
    },
    preferredMode: {
      type: String,
      enum: ['adaptive', 'custom'],
      default: 'adaptive'
    }
  },
  
  // Session History (last 10 sessions for quick access)
  recentSessions: [{
    sessionId: {
      type: String,
      required: true
    },
    mode: {
      type: String,
      enum: ['adaptive', 'custom'],
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    cyclesCompleted: {
      type: Number,
      required: true,
      min: 0
    },
    practiceTime: {
      type: Number,
      required: true,
      min: 0 // in seconds
    },
    timing: {
      inhale: Number,
      hold: Number,
      exhale: Number
    },
    setNumber: {
      type: Number,
      default: null // only for adaptive mode
    },
    difficultyLevel: {
      type: Number,
      default: null // only for adaptive mode
    },
    badgesEarned: [String],
    notes: String
  }],
  
  // Settings and Preferences
  preferences: {
    defaultMode: {
      type: String,
      enum: ['adaptive', 'custom'],
      default: 'adaptive'
    },
    defaultCycles: {
      type: Number,
      default: 6,
      min: 1,
      max: 100
    },
    notifications: {
      dailyReminder: {
        type: Boolean,
        default: true
      },
      streakReminder: {
        type: Boolean,
        default: true
      },
      badgeNotification: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      shareProgress: {
        type: Boolean,
        default: false
      },
      shareAchievements: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true,
  collection: 'userBreathingProgress'
});

// Indexes for fast queries
userBreathingProgressSchema.index({ userId: 1 });
userBreathingProgressSchema.index({ 'adaptiveChallenge.currentSet': 1 });
userBreathingProgressSchema.index({ 'overallStats.lastSessionDate': -1 });
userBreathingProgressSchema.index({ 'overallStats.currentStreak': -1 });

// Virtual for current difficulty level
userBreathingProgressSchema.virtual('currentDifficultyLevel').get(function() {
  if (this.adaptiveChallenge.frozenDifficultyLevel) {
    return this.adaptiveChallenge.frozenDifficultyLevel;
  }
  return this.adaptiveChallenge.currentSet;
});

// Virtual for total badges earned
userBreathingProgressSchema.virtual('totalBadgesEarned').get(function() {
  return this.adaptiveChallenge.badges.length;
});

// Virtual for completion percentage (based on 100 sets goal)
userBreathingProgressSchema.virtual('completionPercentage').get(function() {
  const totalSets = 100; // Goal from requirements
  const completedSets = this.adaptiveChallenge.currentSet - 1; // -1 because current set is in progress
  return Math.min((completedSets / totalSets) * 100, 100);
});

// Method to get current timing based on mode
userBreathingProgressSchema.methods.getCurrentTiming = function() {
  if (this.adaptiveChallenge.isEnabled) {
    return this.adaptiveChallenge.lastAdaptiveTiming;
  } else {
    return this.customBreathing.customTimings;
  }
};

// Method to get current mode
userBreathingProgressSchema.methods.getCurrentMode = function() {
  return this.adaptiveChallenge.isEnabled ? 'adaptive' : 'custom';
};

// Method to check if user has a specific badge
userBreathingProgressSchema.methods.hasBadge = function(badgeName) {
  return this.adaptiveChallenge.badges.includes(badgeName);
};

// Method to award a badge (dynamic - no hardcoded badge names)
userBreathingProgressSchema.methods.awardBadge = function(badgeName) {
  if (!this.hasBadge(badgeName)) {
    this.adaptiveChallenge.badges.push(badgeName);
    
    // Update achievements dynamically
    if (this.adaptiveChallenge.achievements instanceof Map) {
      this.adaptiveChallenge.achievements.set(badgeName, true);
    } else {
      // Fallback for existing data structure
      this.adaptiveChallenge.achievements[badgeName] = true;
    }
    
    return true; // Badge awarded
  }
  return false; // Badge already exists
};

// Method to increment cycle
userBreathingProgressSchema.methods.incrementCycle = function() {
  if (this.adaptiveChallenge.isEnabled) {
    this.adaptiveChallenge.totalCyclesCompleted += 1;
    this.adaptiveChallenge.currentCycleInLevel += 1;
    this.adaptiveChallenge.lastSessionDate = new Date();
    
    // Check if level is complete (6 cycles)
    if (this.adaptiveChallenge.currentCycleInLevel > 6) {
      this.adaptiveChallenge.currentLevel += 1;
      this.adaptiveChallenge.currentCycleInLevel = 1;
    }
  } else {
    this.customBreathing.totalCustomCycles += 1;
  }
  
  // REMOVED: this.overallStats.totalCyclesCompleted += 1; 
  // This is already handled by session recording to prevent double-counting
  this.overallStats.lastSessionDate = new Date();
};

// Method to reset adaptive progress
userBreathingProgressSchema.methods.resetAdaptiveProgress = function() {
  this.adaptiveChallenge.currentLevel = 1;
  this.adaptiveChallenge.currentCycleInLevel = 1;
  this.adaptiveChallenge.totalCyclesCompleted = 0;
  this.adaptiveChallenge.frozenDifficultyLevel = null;
  this.adaptiveChallenge.badges = [];
  this.adaptiveChallenge.achievements = new Map(); // Dynamic achievements
};

// Method to reset custom breathing
userBreathingProgressSchema.methods.resetCustomBreathing = function() {
  this.customBreathing.customTimings = {
    inhale: 4.0,
    hold: 7.0,
    exhale: 8.0
  };
  this.customBreathing.totalCustomCycles = 0;
  this.customBreathing.isInheritedFromAdaptive = false;
};

// Method to inherit timing from adaptive mode
userBreathingProgressSchema.methods.inheritFromAdaptive = function(timing) {
  this.customBreathing.customTimings = timing;
  this.customBreathing.isInheritedFromAdaptive = true;
  this.customBreathing.lastModified = new Date();
};

// Static method to find or create user progress
userBreathingProgressSchema.statics.findOrCreateByUserId = async function(userId) {
  let userProgress = await this.findOne({ userId });
  
  if (!userProgress) {
    userProgress = new this({ userId });
    await userProgress.save();
  }
  
  return userProgress;
};

// Static method to get user progress with user data
userBreathingProgressSchema.statics.getUserProgressWithUser = function(userId) {
  return this.findOne({ userId }).populate('userId', 'name email');
};

// Static method to get leaderboard data
userBreathingProgressSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find()
    .populate('userId', 'name email')
    .sort({ 'overallStats.totalSessionsCompleted': -1, 'overallStats.currentStreak': -1 })
    .limit(limit);
};

module.exports = mongoose.model('UserBreathingProgress', userBreathingProgressSchema); 