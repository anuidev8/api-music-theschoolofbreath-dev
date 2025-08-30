const UserBreathingProgress = require('../models/userBreathingProgress.model');
const BreathworkCycles = require('../models/breathworkCycles.model');
const CustomBreathingProgress = require('../models/customBreathingProgress.model');

// Helper function to find or create user progress
const findOrCreateUserProgress = async (userId) => {
  let userProgress = await UserBreathingProgress.findOne({ userId });
  
  if (!userProgress) {
    userProgress = new UserBreathingProgress({ userId });
    await userProgress.save();
  }
  
  return userProgress;
};

// Get user breathing progress
const getUserBreathingProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const userProgress = await findOrCreateUserProgress(userId);
    
    // Also fetch from customBreathingProgress model to get the latest non-adaptive cycle data
    let customBreathingData = null;
    try {

      customBreathingData = await CustomBreathingProgress.findOne({ userId });
      
      if (customBreathingData) {
        console.log(`🔍 Found customBreathingProgress for user ${userId}:`, {
          totalCyclesCompleted: customBreathingData.statistics.totalCyclesCompleted,
          totalSessionsCompleted: customBreathingData.statistics.totalSessionsCompleted
        });
        
        // Merge the custom breathing data into userProgress
        userProgress.customBreathing.totalCustomCycles = customBreathingData.statistics.totalCyclesCompleted;
        userProgress.customBreathing.totalSessionsCompleted = customBreathingData.statistics.totalSessionsCompleted;
        userProgress.customBreathing.totalPracticeTime = customBreathingData.statistics.totalPracticeTime;
        
        // Update overall stats if custom breathing has more recent data
        if (customBreathingData.statistics.lastSessionDate > userProgress.overallStats.lastSessionDate) {
          userProgress.overallStats.lastSessionDate = customBreathingData.statistics.lastSessionDate;
        }
      }
    } catch (customError) {
      console.log(`⚠️ Could not fetch customBreathingProgress for user ${userId}:`, customError.message);
      // Continue without custom breathing data if there's an error
    }
    
    res.status(200).json({
      success: true,
      data: userProgress,
      message: 'User breathing progress retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user breathing progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update user breathing progress
const updateUserBreathingProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const userProgress = await findOrCreateUserProgress(userId);
    
    // Update specific fields based on what's provided
    if (updateData.adaptiveChallenge) {
      Object.assign(userProgress.adaptiveChallenge, updateData.adaptiveChallenge);
    }
    
    if (updateData.customBreathing) {
      Object.assign(userProgress.customBreathing, updateData.customBreathing);
    }
    
    if (updateData.overallStats) {
      Object.assign(userProgress.overallStats, updateData.overallStats);
    }
    
    if (updateData.preferences) {
      Object.assign(userProgress.preferences, updateData.preferences);
    }
    
    await userProgress.save();
    
    res.status(200).json({
      success: true,
      data: userProgress,
      message: 'User breathing progress updated successfully'
    });
  } catch (error) {
    console.error('Error updating user breathing progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Record a breathing session
const recordBreathingSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const sessionData = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const userProgress = await findOrCreateUserProgress(userId);
    
    // Validate session data
    const {
      sessionId,
      mode,
      startTime,
      endTime,
      cyclesCompleted,
      practiceTime,
      timing,
      setNumber,
      difficultyLevel,
      badgesEarned,
      notes
    } = sessionData;
    
    if (!sessionId || !mode || !startTime || !endTime || cyclesCompleted === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required session data'
      });
    }
    
    // Create session record
    const sessionRecord = {
      sessionId,
      mode,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      cyclesCompleted,
      practiceTime: practiceTime || 0,
      timing,
      setNumber,
      difficultyLevel,
      badgesEarned: badgesEarned || [],
      notes
    };
    
    // Add to recent sessions (keep only last 10)
    userProgress.recentSessions.unshift(sessionRecord);
    if (userProgress.recentSessions.length > 10) {
      userProgress.recentSessions = userProgress.recentSessions.slice(0, 10);
    }
    
    // Update overall stats
    userProgress.overallStats.totalSessionsCompleted += 1;
    userProgress.overallStats.totalCyclesCompleted += cyclesCompleted;
    userProgress.overallStats.totalPracticeTime += practiceTime || 0;
    userProgress.overallStats.lastSessionDate = new Date();
    
    // Update mode-specific stats
    if (mode === 'adaptive') {
      userProgress.adaptiveChallenge.totalSessionsCompleted += 1;
      userProgress.adaptiveChallenge.totalPracticeTime += practiceTime || 0;
      
      // Update longest session if this one is longer
      if (cyclesCompleted > userProgress.adaptiveChallenge.longestSession) {
        userProgress.adaptiveChallenge.longestSession = cyclesCompleted;
      }
      
      // Award badges if earned
      if (badgesEarned && badgesEarned.length > 0) {
        badgesEarned.forEach(badgeName => {
          userProgress.awardBadge(badgeName);
        });
      }
    } else if (mode === 'custom') {
      userProgress.customBreathing.totalSessionsCompleted += 1;
      userProgress.customBreathing.totalPracticeTime += practiceTime || 0;
      // Also update total custom cycles for non-adaptive mode
      userProgress.customBreathing.totalCustomCycles += cyclesCompleted;
    }
    
    // Update streak logic
    const today = new Date();
    const lastSessionDate = new Date(userProgress.overallStats.lastSessionDate);
    const daysDiff = Math.floor((today - lastSessionDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      userProgress.overallStats.currentStreak += 1;
      if (userProgress.overallStats.currentStreak > userProgress.overallStats.longestStreak) {
        userProgress.overallStats.longestStreak = userProgress.overallStats.currentStreak;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      userProgress.overallStats.currentStreak = 1;
    }
    
    // Update average session length
    const totalSessions = userProgress.overallStats.totalSessionsCompleted;
    const totalCycles = userProgress.overallStats.totalCyclesCompleted;
    userProgress.overallStats.averageSessionLength = Math.round(totalCycles / totalSessions);
    
    await userProgress.save();
    
    res.status(201).json({
      success: true,
      data: userProgress,
      message: 'Breathing session recorded successfully'
    });
  } catch (error) {
    console.error('Error recording breathing session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Award a badge to user
const awardBadge = async (req, res) => {
  try {
    const { userId } = req.params;
    const { badgeName } = req.body;
    
    if (!userId || !badgeName) {
      return res.status(400).json({
        success: false,
        message: 'User ID and badge name are required'
      });
    }
    
    const userProgress = await findOrCreateUserProgress(userId);
    
    const badgeAwarded = userProgress.awardBadge(badgeName);
    
    if (badgeAwarded) {
      await userProgress.save();
      
      res.status(200).json({
        success: true,
        data: {
          badgeName,
          totalBadges: userProgress.totalBadgesEarned,
          badges: userProgress.adaptiveChallenge.badges
        },
        message: `Badge "${badgeName}" awarded successfully`
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          badgeName,
          totalBadges: userProgress.totalBadgesEarned,
          badges: userProgress.adaptiveChallenge.badges
        },
        message: `Badge "${badgeName}" already exists`
      });
    }
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Increment cycle for user
const incrementCycle = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const userProgress = await findOrCreateUserProgress(userId);
    
    userProgress.incrementCycle();
    await userProgress.save();
    
    res.status(200).json({
      success: true,
      data: {
        currentLevel: userProgress.adaptiveChallenge.currentLevel,
        currentCycleInLevel: userProgress.adaptiveChallenge.currentCycleInLevel,
        totalCyclesCompleted: userProgress.adaptiveChallenge.totalCyclesCompleted,
        totalCustomCycles: userProgress.customBreathing.totalCustomCycles,
        overallTotalCycles: userProgress.overallStats.totalCyclesCompleted
      },
      message: 'Cycle incremented successfully'
    });
  } catch (error) {
    console.error('Error incrementing cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Increment multiple cycles for user (for session completion)
const incrementMultipleCycles = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cycleCount } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!cycleCount || cycleCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid cycle count is required'
      });
    }
    
    const userProgress = await findOrCreateUserProgress(userId);
    
    // Increment cycles multiple times
    for (let i = 0; i < cycleCount; i++) {
      userProgress.incrementCycle();
    }
    
    await userProgress.save();
    
    res.status(200).json({
      success: true,
      data: {
        currentLevel: userProgress.adaptiveChallenge.currentLevel,
        currentCycleInLevel: userProgress.adaptiveChallenge.currentCycleInLevel,
        totalCyclesCompleted: userProgress.adaptiveChallenge.totalCyclesCompleted,
        totalCustomCycles: userProgress.customBreathing.totalCustomCycles,
        overallTotalCycles: userProgress.overallStats.totalCyclesCompleted
      },
      message: `${cycleCount} cycles incremented successfully`
    });
  } catch (error) {
    console.error('Error incrementing multiple cycles:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reset adaptive progress
const resetAdaptiveProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const userProgress = await findOrCreateUserProgress(userId);
    
    userProgress.resetAdaptiveProgress();
    await userProgress.save();
    
    res.status(200).json({
      success: true,
      data: userProgress,
      message: 'Adaptive progress reset successfully'
    });
  } catch (error) {
    console.error('Error resetting adaptive progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Store completed levels (new endpoint for continuous session)
const storeCompletedLevels = async (req, res) => {
  try {
    const { userId } = req.params;
    const { completedLevels, sessionData } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!completedLevels || !Array.isArray(completedLevels) || completedLevels.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Completed levels array is required'
      });
    }
    
    const userProgress = await findOrCreateUserProgress(userId);
    
    // Calculate total cycles and practice time from completed levels
    const totalCyclesCompleted = completedLevels.reduce((sum, level) => sum + level.cyclesCompleted, 0);
    const totalPracticeTime = completedLevels.reduce((sum, level) => {
      const levelDuration = level.timing.inhale + level.timing.hold + level.timing.exhale;
      return sum + (level.cyclesCompleted * levelDuration);
    }, 0);
    
    // Process badges for completed levels
    const badgesEarned = [];
  
    
    for (const completedLevel of completedLevels) {
      // Get the first cycle of this level to get badge info
      const levelCycle = await BreathworkCycles.findOne({
        levelNumber: completedLevel.levelNumber,
        cycleInLevel: 1
      });
      
      if (levelCycle && levelCycle.badgeInfo && levelCycle.badgeInfo.badgeName) {
        const badgeName = levelCycle.badgeInfo.badgeName;
        
        // Check if user already has this badge
        if (!userProgress.adaptiveChallenge.badges.includes(badgeName)) {
          // Award the badge
          userProgress.awardBadge(badgeName);
          badgesEarned.push(badgeName);
          console.log(`🏆 Badge awarded: ${badgeName} for Level ${completedLevel.levelNumber}`);
        } else {
          console.log(`⚠️ User already has badge: ${badgeName} for Level ${completedLevel.levelNumber}`);
        }
      }
    }
    
    // Update user progress with completed levels
    userProgress.adaptiveChallenge.totalCyclesCompleted += totalCyclesCompleted;
    userProgress.adaptiveChallenge.totalSessionsCompleted += 1;
    userProgress.adaptiveChallenge.totalPracticeTime += totalPracticeTime;
    userProgress.adaptiveChallenge.lastSessionDate = new Date();
    
    // Update current level to the next level after the last completed level
    const lastCompletedLevel = completedLevels[completedLevels.length - 1];
    userProgress.adaptiveChallenge.currentLevel = lastCompletedLevel.levelNumber + 1;
    userProgress.adaptiveChallenge.currentCycleInLevel = 1;
    
    // Update last adaptive timing to the last completed level's timing
    userProgress.adaptiveChallenge.lastAdaptiveTiming = lastCompletedLevel.timing;
    
    // Update overall stats
    userProgress.overallStats.totalSessionsCompleted += 1;
    userProgress.overallStats.totalCyclesCompleted += totalCyclesCompleted;
    userProgress.overallStats.totalPracticeTime += totalPracticeTime;
    userProgress.overallStats.lastSessionDate = new Date();
    
    // Add session to recent sessions
    const sessionRecord = {
      sessionId: sessionData.sessionId || `session_${Date.now()}`,
      mode: 'adaptive',
      startTime: sessionData.startTime || new Date().toISOString(),
      endTime: sessionData.endTime || new Date().toISOString(),
      cyclesCompleted: totalCyclesCompleted,
      practiceTime: totalPracticeTime,
      timing: lastCompletedLevel.timing,
      levelNumber: lastCompletedLevel.levelNumber,
      difficultyLevel: lastCompletedLevel.levelNumber,
      badgesEarned: badgesEarned, // Use the badges we just earned
      notes: sessionData.notes || `Completed ${completedLevels.length} levels: ${completedLevels.map(l => `Level ${l.levelNumber}`).join(', ')}`,
      completedLevels: completedLevels // Store the array of completed levels
    };
    
    userProgress.recentSessions.unshift(sessionRecord);
    
    // Keep only the last 10 sessions
    if (userProgress.recentSessions.length > 10) {
      userProgress.recentSessions = userProgress.recentSessions.slice(0, 10);
    }
    
    await userProgress.save();
    
    res.status(200).json({
      success: true,
      data: {
        currentLevel: userProgress.adaptiveChallenge.currentLevel,
        currentCycleInLevel: userProgress.adaptiveChallenge.currentCycleInLevel,
        totalCyclesCompleted: userProgress.adaptiveChallenge.totalCyclesCompleted,
        totalSessionsCompleted: userProgress.adaptiveChallenge.totalSessionsCompleted,
        totalPracticeTime: userProgress.adaptiveChallenge.totalPracticeTime,
        completedLevels: completedLevels,
        recentSessions: userProgress.recentSessions.slice(0, 1), // Return the latest session
        badgesEarned: badgesEarned // Return earned badges
      },
      message: `Successfully stored ${completedLevels.length} completed levels${badgesEarned.length > 0 ? ` and awarded ${badgesEarned.length} badge(s)` : ''}`
    });
  } catch (error) {
    console.error('Error storing completed levels:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reset custom breathing
const resetCustomBreathing = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const userProgress = await findOrCreateUserProgress(userId);
    
    userProgress.resetCustomBreathing();
    await userProgress.save();
    
    res.status(200).json({
      success: true,
      data: userProgress,
      message: 'Custom breathing reset successfully'
    });
  } catch (error) {
    console.error('Error resetting custom breathing:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const leaderboard = await UserBreathingProgress.getLeaderboard(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: leaderboard,
      message: 'Leaderboard retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user statistics
const getUserStatistics = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const userProgress = await findOrCreateUserProgress(userId);
    
    const statistics = {
      overall: {
        totalSessions: userProgress.overallStats.totalSessionsCompleted,
        totalCycles: userProgress.overallStats.totalCyclesCompleted,
        totalPracticeTime: userProgress.overallStats.totalPracticeTime,
        currentStreak: userProgress.overallStats.currentStreak,
        longestStreak: userProgress.overallStats.longestStreak,
        averageSessionLength: userProgress.overallStats.averageSessionLength,
        completionPercentage: userProgress.completionPercentage
      },
      adaptive: {
        currentSet: userProgress.adaptiveChallenge.currentSet,
        currentCycleInSet: userProgress.adaptiveChallenge.currentCycleInSet,
        totalCycles: userProgress.adaptiveChallenge.totalCyclesCompleted,
        totalSessions: userProgress.adaptiveChallenge.totalSessionsCompleted,
        totalPracticeTime: userProgress.adaptiveChallenge.totalPracticeTime,
        longestSession: userProgress.adaptiveChallenge.longestSession,
        badges: userProgress.adaptiveChallenge.badges,
        achievements: userProgress.adaptiveChallenge.achievements,
        currentDifficultyLevel: userProgress.currentDifficultyLevel
      },
      custom: {
        totalCycles: userProgress.customBreathing.totalCustomCycles,
        totalSessions: userProgress.customBreathing.totalSessionsCompleted,
        totalPracticeTime: userProgress.customBreathing.totalPracticeTime,
        customTimings: userProgress.customBreathing.customTimings
      },
      recentSessions: userProgress.recentSessions
    };
    
    res.status(200).json({
      success: true,
      data: statistics,
      message: 'User statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Record a breathing session with cycle increments
const recordSessionWithCycles = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionData, cycleCount } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!sessionData) {
      return res.status(400).json({
        success: false,
        message: 'Session data is required'
      });
    }
    
    const userProgress = await findOrCreateUserProgress(userId);
    
    // Validate session data
    const {
      sessionId,
      mode,
      startTime,
      endTime,
      cyclesCompleted,
      practiceTime,
      timing,
      setNumber,
      difficultyLevel,
      badgesEarned,
      notes
    } = sessionData;
    
    if (!sessionId || !mode || !startTime || !endTime || cyclesCompleted === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required session data'
      });
    }
    
    // Create session record
    const sessionRecord = {
      sessionId,
      mode,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      cyclesCompleted,
      practiceTime: practiceTime || 0,
      timing,
      setNumber,
      difficultyLevel,
      badgesEarned: badgesEarned || [],
      notes
    };
    
    console.log(`📝 Session record created:`, {
      sessionId,
      mode,
      cyclesCompleted,
      setNumber,
      badgesEarned: sessionRecord.badgesEarned
    });
    
    // Add to recent sessions (keep only last 10)
    userProgress.recentSessions.unshift(sessionRecord);
    if (userProgress.recentSessions.length > 10) {
      userProgress.recentSessions = userProgress.recentSessions.slice(0, 10);
    }
    
    // Update overall stats
    userProgress.overallStats.totalSessionsCompleted += 1;
    userProgress.overallStats.totalCyclesCompleted += cyclesCompleted;
    userProgress.overallStats.totalPracticeTime += practiceTime || 0;
    userProgress.overallStats.lastSessionDate = new Date();
    
    // Update mode-specific stats
    if (mode === 'adaptive') {
      // Enable adaptive mode if session is recorded in adaptive mode
      userProgress.adaptiveChallenge.isEnabled = true;
      userProgress.customBreathing.isActive = false;
      
      userProgress.adaptiveChallenge.totalSessionsCompleted += 1;
      userProgress.adaptiveChallenge.totalPracticeTime += practiceTime || 0;
      
      // Update longest session if this one is longer
      if (cyclesCompleted > userProgress.adaptiveChallenge.longestSession) {
        userProgress.adaptiveChallenge.longestSession = cyclesCompleted;
      }
      
      // Award badges if earned
      if (badgesEarned && badgesEarned.length > 0) {
        badgesEarned.forEach(badgeName => {
          userProgress.awardBadge(badgeName);
        });
      }
    } else if (mode === 'custom') {
      // Enable custom mode if session is recorded in custom mode
      userProgress.adaptiveChallenge.isEnabled = false;
      userProgress.customBreathing.isActive = true;
      
      userProgress.customBreathing.totalSessionsCompleted += 1;
      userProgress.customBreathing.totalPracticeTime += practiceTime || 0;
    }
    
    // Update streak logic
    const today = new Date();
    const lastSessionDate = new Date(userProgress.overallStats.lastSessionDate);
    const daysDiff = Math.floor((today - lastSessionDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      userProgress.overallStats.currentStreak += 1;
      if (userProgress.overallStats.currentStreak > userProgress.overallStats.longestStreak) {
        userProgress.overallStats.longestStreak = userProgress.overallStats.currentStreak;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      userProgress.overallStats.currentStreak = 1;
    }
    
    // Calculate average session length
    const totalSessions = userProgress.overallStats.totalSessionsCompleted;
    const totalCycles = userProgress.overallStats.totalCyclesCompleted;
    userProgress.overallStats.averageSessionLength = totalSessions > 0 ? Math.round(totalCycles / totalSessions) : 0;
    
    // Increment cycles if provided
    if (cycleCount && cycleCount > 0) {
      for (let i = 0; i < cycleCount; i++) {
        userProgress.incrementCycle();
      }
      
      // Check if a set was completed and award badge
      if (mode === 'adaptive' && setNumber) {
        console.log(`🔍 Checking for badge for Set ${setNumber} in adaptive mode`);
        
        // Get any cycle from the set (all have same badge info)
        const setCycle = await BreathworkCycles.findOne({ setNumber: setNumber });
        console.log(`🔍 Found cycle for Set ${setNumber}:`, setCycle ? 'Yes' : 'No');
        
        if (setCycle && setCycle.badgeInfo && setCycle.badgeInfo.badgeName) {
          const badgeName = setCycle.badgeInfo.badgeName;
          console.log(`🔍 Badge name: ${badgeName}`);
          console.log(`🔍 User current badges:`, userProgress.adaptiveChallenge.badges);
          
          // Check if user doesn't already have this badge
          if (!userProgress.adaptiveChallenge.badges.includes(badgeName)) {
            // Award the badge
            userProgress.awardBadge(badgeName);
            console.log(`🏆 Badge awarded: ${badgeName} for Set ${setNumber}`);
            
            // Add to session record badgesEarned
            const latestSession = userProgress.recentSessions[0];
            if (latestSession && !latestSession.badgesEarned) {
              latestSession.badgesEarned = [];
            }
            if (latestSession) {
              latestSession.badgesEarned.push(badgeName);
              console.log(`🏆 Added to session badgesEarned:`, latestSession.badgesEarned);
            }
          } else {
            console.log(`⚠️ User already has badge: ${badgeName}`);
          }
        } else {
          console.log(`⚠️ No badge info found for Set ${setNumber}`);
        }
      } else {
        console.log(`⚠️ Not checking for badge - mode: ${mode}, setNumber: ${setNumber}`);
      }
    }
    
    await userProgress.save();
    
    // Log final results
    const latestSession = userProgress.recentSessions[0];
    console.log(`✅ Session saved successfully`);
    console.log(`🏆 User badges after save:`, userProgress.adaptiveChallenge.badges);
    console.log(`📊 Latest session badgesEarned:`, latestSession ? latestSession.badgesEarned : 'No session');
    
    res.status(201).json({
      success: true,
      data: userProgress,
      message: `Session recorded and ${cycleCount || 0} cycles incremented successfully`
    });
  } catch (error) {
    console.error('Error recording session with cycles:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Record a non-adaptive mode session with today's cycles tracking
const recordNonAdaptiveSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const sessionData = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const userProgress = await findOrCreateUserProgress(userId);
    
    // Validate session data
    const {
      sessionId,
      startTime,
      endTime,
      cyclesCompleted,
      practiceTime,
      timing,
      levelNumber,
      notes
    } = sessionData;
    
    if (!sessionId || !startTime || !endTime || cyclesCompleted === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required session data'
      });
    }
    
    // Create session record for non-adaptive mode
    const sessionRecord = {
      sessionId,
      mode: 'custom', // Non-adaptive mode is stored as 'custom'
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      cyclesCompleted,
      practiceTime: practiceTime || 0,
      timing,
      setNumber: null, // Not applicable for non-adaptive mode
      difficultyLevel: levelNumber || 1, // Use the level number as difficulty level
      badgesEarned: [], // No badges for non-adaptive mode
      notes: notes || `Non-adaptive session completed with Level ${levelNumber || 1} timing`
    };
    
    // Add to recent sessions (keep only last 10)
    userProgress.recentSessions.unshift(sessionRecord);
    if (userProgress.recentSessions.length > 10) {
      userProgress.recentSessions = userProgress.recentSessions.slice(0, 10);
    }
    
    // Update overall stats
    userProgress.overallStats.totalSessionsCompleted += 1;
    userProgress.overallStats.totalCyclesCompleted += cyclesCompleted;
    userProgress.overallStats.totalPracticeTime += practiceTime || 0;
    userProgress.overallStats.lastSessionDate = new Date();
    
    // Update custom breathing stats (non-adaptive mode)
    userProgress.customBreathing.totalSessionsCompleted += 1;
    userProgress.customBreathing.totalPracticeTime += practiceTime || 0;
    userProgress.customBreathing.totalCustomCycles += cyclesCompleted;
    
    // Update streak logic
    const today = new Date();
    const lastSessionDate = new Date(userProgress.overallStats.lastSessionDate);
    const daysDiff = Math.floor((today - lastSessionDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      userProgress.overallStats.currentStreak += 1;
      if (userProgress.overallStats.currentStreak > userProgress.overallStats.longestStreak) {
        userProgress.overallStats.longestStreak = userProgress.overallStats.currentStreak;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      userProgress.overallStats.currentStreak = 1;
    }
    
    // Update average session length
    const totalSessions = userProgress.overallStats.totalSessionsCompleted;
    const totalCycles = userProgress.overallStats.totalCyclesCompleted;
    userProgress.overallStats.averageSessionLength = totalSessions > 0 ? Math.round(totalCycles / totalSessions) : 0;
    
    await userProgress.save();
    
    res.status(201).json({
      success: true,
      data: userProgress,
      message: 'Non-adaptive breathing session recorded successfully'
    });
  } catch (error) {
    console.error('Error recording non-adaptive breathing session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get today's cycles for non-adaptive mode
const getTodayCycles = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const userProgress = await findOrCreateUserProgress(userId);
    
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter recent sessions for today (non-adaptive mode only)
    const todaySessions = userProgress.recentSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime() && session.mode === 'custom';
    });
    
    // Calculate today's total cycles
    const todayCycles = todaySessions.reduce((total, session) => total + session.cyclesCompleted, 0);
    
    // Get total cycles for non-adaptive mode
    const totalCycles = userProgress.customBreathing.totalCustomCycles;
    
    res.status(200).json({
      success: true,
      data: {
        todayCycles,
        totalCycles,
        todaySessions: todaySessions.length
      },
      message: 'Today\'s cycles retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting today\'s cycles:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getUserBreathingProgress,
  updateUserBreathingProgress,
  recordBreathingSession,
  awardBadge,
  incrementCycle,
  incrementMultipleCycles,
  resetAdaptiveProgress,
  storeCompletedLevels,
  resetCustomBreathing,
  getLeaderboard,
  getUserStatistics,
  recordSessionWithCycles,
  recordNonAdaptiveSession,
  getTodayCycles
}; 