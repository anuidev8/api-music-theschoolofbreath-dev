const express = require('express');
const router = express.Router();
const {
  getUserBreathingProgress,
  updateUserBreathingProgress,
  recordBreathingSession,
  recordSessionWithCycles,
  recordNonAdaptiveSession,
  getTodayCycles,
  awardBadge,
  incrementCycle,
  incrementMultipleCycles,
  resetAdaptiveProgress,
  storeCompletedLevels,
  resetCustomBreathing,
  getLeaderboard,
  getUserStatistics
} = require('../controllers/userBreathingProgress.controller');

// Middleware for authentication (you can add this later)
// const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all routes
// router.use(authMiddleware);

// User Progress Routes
router.get('/user/:userId/progress', getUserBreathingProgress);
router.put('/user/:userId/progress', updateUserBreathingProgress);
router.get('/user/:userId/today-cycles', getTodayCycles);

// Session Management Routes
router.post('/user/:userId/session', recordBreathingSession);
router.post('/user/:userId/session-with-cycles', recordSessionWithCycles);
router.post('/user/:userId/non-adaptive-session', recordNonAdaptiveSession);
router.post('/user/:userId/completed-levels', storeCompletedLevels);
router.post('/user/:userId/badge', awardBadge);
router.post('/user/:userId/cycle/increment', incrementCycle);
router.post('/user/:userId/cycle/increment-multiple', incrementMultipleCycles);

// Reset Routes
router.post('/user/:userId/adaptive/reset', resetAdaptiveProgress);
router.post('/user/:userId/custom/reset', resetCustomBreathing);

// Statistics and Analytics Routes
router.get('/leaderboard', getLeaderboard);
router.get('/user/:userId/statistics', getUserStatistics);

module.exports = router; 