const CustomBreathingProgress = require('../models/customBreathingProgress.model');

// Helper function to find or create custom breathing progress
const findOrCreateCustomProgress = async (userId) => {
  let customProgress = await CustomBreathingProgress.findOne({ userId });
  
  if (!customProgress) {
    customProgress = new CustomBreathingProgress({ userId });
    await customProgress.save();
  }
  
  return customProgress;
};

// Get custom breathing progress
const getCustomBreathingProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const customProgress = await findOrCreateCustomProgress(userId);
    
    res.status(200).json({
      success: true,
      data: customProgress,
      message: 'Custom breathing progress retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting custom breathing progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Record a custom breathing session (single endpoint like adaptive mode)
const recordCustomSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const sessionData = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const customProgress = await findOrCreateCustomProgress(userId);
    
    // Validate session data
    const {
      sessionId,
      startTime,
      endTime,
      cyclesCompleted,
      practiceTime,
      timing,
      notes
    } = sessionData;
    
    if (!sessionId || !startTime || !endTime || cyclesCompleted === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required session data'
      });
    }
    
    // Create session record
    const sessionRecord = {
      sessionId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      targetCycles: cyclesCompleted, // For custom mode, target = completed
      completedCycles: cyclesCompleted,
      practiceTime: practiceTime || 0,
      timing,
      notes: notes || `Completed ${cyclesCompleted} cycles in custom mode`
    };
    
    console.log(`📝 Custom session record created:`, {
      sessionId,
      cyclesCompleted,
      practiceTime: sessionRecord.practiceTime
    });
    
    // Add to recent sessions (keep only last 20)
    customProgress.recentSessions.unshift(sessionRecord);
    if (customProgress.recentSessions.length > 20) {
      customProgress.recentSessions = customProgress.recentSessions.slice(0, 20);
    }
    
    // Update statistics
    customProgress.statistics.totalSessionsCompleted += 1;
    customProgress.statistics.totalCyclesCompleted += cyclesCompleted;
    customProgress.statistics.totalPracticeTime += practiceTime || 0;
    customProgress.statistics.lastSessionDate = new Date();
    
    // Update longest session if this one is longer
    if (cyclesCompleted > customProgress.statistics.longestSession) {
      customProgress.statistics.longestSession = cyclesCompleted;
    }
    
    // Calculate average session length
    const totalSessions = customProgress.statistics.totalSessionsCompleted;
    const totalCycles = customProgress.statistics.totalCyclesCompleted;
    customProgress.statistics.averageSessionLength = totalSessions > 0 ? Math.round(totalCycles / totalSessions) : 0;
    
    // Update streak logic
    const today = new Date();
    const lastSessionDate = customProgress.statistics.lastSessionDate;
    const daysDiff = Math.floor((today - lastSessionDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      customProgress.statistics.currentStreak += 1;
      if (customProgress.statistics.currentStreak > customProgress.statistics.longestStreak) {
        customProgress.statistics.longestStreak = customProgress.statistics.currentStreak;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      customProgress.statistics.currentStreak = 1;
    }
    
    await customProgress.save();
    
    console.log(`✅ Custom session saved successfully`);
    console.log(`📊 Custom statistics updated:`, {
      totalSessions: customProgress.statistics.totalSessionsCompleted,
      totalCycles: customProgress.statistics.totalCyclesCompleted,
      longestSession: customProgress.statistics.longestSession
    });
    
    res.status(201).json({
      success: true,
      data: {
        sessionRecord,
        statistics: customProgress.statistics,
        totalSessions: customProgress.statistics.totalSessionsCompleted,
        totalCycles: customProgress.statistics.totalCyclesCompleted
      },
      message: 'Custom breathing session recorded successfully'
    });
  } catch (error) {
    console.error('Error recording custom session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get custom breathing statistics
const getCustomStatistics = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const customProgress = await findOrCreateCustomProgress(userId);
    
    const statistics = {
      currentSession: {
        isActive: customProgress.currentSession.isActive,
        targetCycles: customProgress.currentSession.targetCycles,
        completedCycles: customProgress.currentSession.completedCycles,
        currentCycle: customProgress.currentSession.currentCycle,
        progress: customProgress.currentSessionProgress,
        timing: customProgress.currentSession.timing
      },
      overall: {
        totalSessions: customProgress.statistics.totalSessionsCompleted,
        totalCycles: customProgress.statistics.totalCyclesCompleted,
        totalPracticeTime: customProgress.statistics.totalPracticeTime,
        longestSession: customProgress.statistics.longestSession,
        averageSessionLength: customProgress.statistics.averageSessionLength,
        currentStreak: customProgress.statistics.currentStreak,
        longestStreak: customProgress.statistics.longestStreak,
        lastSessionDate: customProgress.statistics.lastSessionDate
      },
      recentSessions: customProgress.recentSessions.slice(0, 10), // Last 10 sessions
      currentSessionCycles: customProgress.currentSessionCycles // Current session cycle details
    };
    
    res.status(200).json({
      success: true,
      data: statistics,
      message: 'Custom breathing statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting custom statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update custom breathing timing
const updateCustomTiming = async (req, res) => {
  try {
    const { userId } = req.params;
    const { timing } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!timing || !timing.inhale || !timing.hold || !timing.exhale) {
      return res.status(400).json({
        success: false,
        message: 'Valid timing object with inhale, hold, and exhale is required'
      });
    }
    
    // Validate timing values
    if (timing.inhale < 1 || timing.inhale > 20 ||
        timing.hold < 1 || timing.hold > 20 ||
        timing.exhale < 1 || timing.exhale > 20) {
      return res.status(400).json({
        success: false,
        message: 'Timing values must be between 1 and 20 seconds'
      });
    }

    const customProgress = await findOrCreateCustomProgress(userId);
    
    // Update timing for current session if active
    if (customProgress.currentSession.isActive) {
      customProgress.currentSession.timing = timing;
    }
    
    await customProgress.save();
    
    console.log(`⚙️ Custom timing updated for user ${userId}:`, timing);
    
    res.status(200).json({
      success: true,
      data: {
        timing: customProgress.currentSession.timing
      },
      message: 'Custom breathing timing updated successfully'
    });
  } catch (error) {
    console.error('Error updating custom timing:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reset custom breathing progress
const resetCustomProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const customProgress = await findOrCreateCustomProgress(userId);
    
    // Reset all progress
    customProgress.resetProgress();
    await customProgress.save();
    
    console.log(`🔄 Custom progress reset for user ${userId}`);
    
    res.status(200).json({
      success: true,
      data: customProgress,
      message: 'Custom breathing progress reset successfully'
    });
  } catch (error) {
    console.error('Error resetting custom progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getCustomBreathingProgress,
  recordCustomSession,
  getCustomStatistics,
  updateCustomTiming,
  resetCustomProgress
}; 