const mongoose = require('mongoose');

const customBreathingProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Current Session Progress
  currentSession: {
    isActive: {
      type: Boolean,
      default: false
    },
    startTime: {
      type: Date,
      default: null
    },
    targetCycles: {
      type: Number,
      default: 6,
      min: 1,
      max: 100
    },
    completedCycles: {
      type: Number,
      default: 0,
      min: 0
    },
    currentCycle: {
      type: Number,
      default: 0,
      min: 0
    },
    timing: {
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
    }
  },
  
  // Overall Custom Breathing Statistics
  statistics: {
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
    longestSession: {
      type: Number,
      default: 0, // in cycles
      min: 0
    },
    averageSessionLength: {
      type: Number,
      default: 0, // in cycles
      min: 0
    },
    lastSessionDate: {
      type: Date,
      default: null
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
    }
  },
  
  // Session History (last 20 sessions)
  recentSessions: [{
    sessionId: {
      type: String,
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
    targetCycles: {
      type: Number,
      required: true,
      min: 1
    },
    completedCycles: {
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
    notes: String
  }],
  
  // Cycle-by-cycle tracking for current session
  currentSessionCycles: [{
    cycleNumber: {
      type: Number,
      required: true,
      min: 1
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 0 // in seconds
    },
    timing: {
      inhale: Number,
      hold: Number,
      exhale: Number
    }
  }]
}, {
  timestamps: true,
  collection: 'customBreathingProgress'
});

// Indexes for fast queries
customBreathingProgressSchema.index({ userId: 1 });
customBreathingProgressSchema.index({ 'statistics.lastSessionDate': -1 });
customBreathingProgressSchema.index({ 'statistics.currentStreak': -1 });

// Virtual for completion percentage of current session
customBreathingProgressSchema.virtual('currentSessionProgress').get(function() {
  if (!this.currentSession.isActive || this.currentSession.targetCycles === 0) {
    return 0;
  }
  return (this.currentSession.completedCycles / this.currentSession.targetCycles) * 100;
});

// Method to start a new custom breathing session
customBreathingProgressSchema.methods.startSession = function(targetCycles, timing) {
  this.currentSession.isActive = true;
  this.currentSession.startTime = new Date();
  this.currentSession.targetCycles = targetCycles || 6;
  this.currentSession.completedCycles = 0;
  this.currentSession.currentCycle = 0;
  this.currentSession.timing = timing || {
    inhale: 4.0,
    hold: 7.0,
    exhale: 8.0
  };
  this.currentSessionCycles = []; // Clear previous session cycles
};

// Method to complete a cycle in the current session
customBreathingProgressSchema.methods.completeCycle = function(cycleTiming) {
  if (!this.currentSession.isActive) {
    throw new Error('No active session to complete cycle');
  }
  
  const cycleNumber = this.currentSession.completedCycles + 1;
  const endTime = new Date();
  const startTime = this.currentSessionCycles.length > 0 
    ? this.currentSessionCycles[this.currentSessionCycles.length - 1].endTime
    : this.currentSession.startTime;
  
  const duration = Math.round((endTime - startTime) / 1000); // Duration in seconds
  
  // Add cycle record
  this.currentSessionCycles.push({
    cycleNumber,
    startTime,
    endTime,
    duration,
    timing: cycleTiming || this.currentSession.timing
  });
  
  // Update session progress
  this.currentSession.completedCycles += 1;
  this.currentSession.currentCycle = this.currentSession.completedCycles;
  
  // Update overall statistics
  this.statistics.totalCyclesCompleted += 1;
  this.statistics.totalPracticeTime += duration;
  
  return {
    cycleNumber,
    completedCycles: this.currentSession.completedCycles,
    targetCycles: this.currentSession.targetCycles,
    isSessionComplete: this.currentSession.completedCycles >= this.currentSession.targetCycles
  };
};

// Method to end the current session
customBreathingProgressSchema.methods.endSession = function() {
  if (!this.currentSession.isActive) {
    throw new Error('No active session to end');
  }
  
  const endTime = new Date();
  const startTime = this.currentSession.startTime;
  const totalPracticeTime = Math.round((endTime - startTime) / 1000);
  const completedCycles = this.currentSession.completedCycles;
  
  // Create session record
  const sessionRecord = {
    sessionId: `custom_session_${Date.now()}`,
    startTime,
    endTime,
    targetCycles: this.currentSession.targetCycles,
    completedCycles,
    practiceTime: totalPracticeTime,
    timing: this.currentSession.timing,
    notes: `Completed ${completedCycles} cycles in custom mode`
  };
  
  // Add to recent sessions (keep only last 20)
  this.recentSessions.unshift(sessionRecord);
  if (this.recentSessions.length > 20) {
    this.recentSessions = this.recentSessions.slice(0, 20);
  }
  
  // Update statistics
  this.statistics.totalSessionsCompleted += 1;
  this.statistics.lastSessionDate = endTime;
  
  // Update longest session if this one is longer
  if (completedCycles > this.statistics.longestSession) {
    this.statistics.longestSession = completedCycles;
  }
  
  // Calculate average session length
  const totalSessions = this.statistics.totalSessionsCompleted;
  const totalCycles = this.statistics.totalCyclesCompleted;
  this.statistics.averageSessionLength = totalSessions > 0 ? Math.round(totalCycles / totalSessions) : 0;
  
  // Update streak logic
  const today = new Date();
  const lastSessionDate = this.statistics.lastSessionDate;
  const daysDiff = Math.floor((today - lastSessionDate) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    // Consecutive day
    this.statistics.currentStreak += 1;
    if (this.statistics.currentStreak > this.statistics.longestStreak) {
      this.statistics.longestStreak = this.statistics.currentStreak;
    }
  } else if (daysDiff > 1) {
    // Streak broken
    this.statistics.currentStreak = 1;
  }
  
  // Reset current session
  this.currentSession.isActive = false;
  this.currentSession.startTime = null;
  this.currentSession.completedCycles = 0;
  this.currentSession.currentCycle = 0;
  this.currentSessionCycles = []; // Clear cycle records
  
  return sessionRecord;
};

// Method to pause the current session
customBreathingProgressSchema.methods.pauseSession = function() {
  if (!this.currentSession.isActive) {
    throw new Error('No active session to pause');
  }
  
  this.currentSession.isActive = false;
  return {
    completedCycles: this.currentSession.completedCycles,
    targetCycles: this.currentSession.targetCycles,
    sessionData: this.currentSession
  };
};

// Method to resume a paused session
customBreathingProgressSchema.methods.resumeSession = function() {
  if (this.currentSession.isActive) {
    throw new Error('Session is already active');
  }
  
  if (!this.currentSession.startTime) {
    throw new Error('No session to resume');
  }
  
  this.currentSession.isActive = true;
  return {
    completedCycles: this.currentSession.completedCycles,
    targetCycles: this.currentSession.targetCycles,
    sessionData: this.currentSession
  };
};

// Method to reset custom breathing progress
customBreathingProgressSchema.methods.resetProgress = function() {
  this.currentSession = {
    isActive: false,
    startTime: null,
    targetCycles: 6,
    completedCycles: 0,
    currentCycle: 0,
    timing: {
      inhale: 4.0,
      hold: 7.0,
      exhale: 8.0
    }
  };
  
  this.statistics = {
    totalSessionsCompleted: 0,
    totalCyclesCompleted: 0,
    totalPracticeTime: 0,
    longestSession: 0,
    averageSessionLength: 0,
    lastSessionDate: null,
    currentStreak: 0,
    longestStreak: 0
  };
  
  this.recentSessions = [];
  this.currentSessionCycles = [];
};

// Static method to find or create custom breathing progress
customBreathingProgressSchema.statics.findOrCreateByUserId = async function(userId) {
  let customProgress = await this.findOne({ userId });
  
  if (!customProgress) {
    customProgress = new this({ userId });
    await customProgress.save();
  }
  
  return customProgress;
};

module.exports = mongoose.model('CustomBreathingProgress', customBreathingProgressSchema); 