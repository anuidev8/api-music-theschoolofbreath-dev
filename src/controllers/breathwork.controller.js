const BreathworkCycle = require('../models/breathworkCycles.model');

/**
 * Get all breathwork cycles
 * @route GET /api/breathwork/cycles
 * @access Public
 */
const getAllCycles = async (req, res) => {
  try {
    const cycles = await BreathworkCycle.find({ isActive: true })
      .sort({ cycleNumber: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      message: 'Breathwork cycles retrieved successfully',
      data: cycles,
      count: cycles.length
    });
  } catch (error) {
    console.error('Error fetching all cycles:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get a specific cycle by cycle number
 * @route GET /api/breathwork/cycle/:cycleNumber
 * @access Public
 */
const getCycleByNumber = async (req, res) => {
  try {
    const { cycleNumber } = req.params;
    
    if (!cycleNumber || isNaN(cycleNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Valid cycle number is required'
      });
    }

    const cycle = await BreathworkCycle.findOne({ 
      cycleNumber: parseInt(cycleNumber),
      isActive: true 
    }).select('-__v');

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: `Cycle ${cycleNumber} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cycle retrieved successfully',
      data: cycle
    });
  } catch (error) {
    console.error('Error fetching cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get all cycles in a specific level
 * @route GET /api/breathwork/level/:levelNumber
 * @access Public
 */
const getCyclesByLevel = async (req, res) => {
  try {
    const { levelNumber } = req.params;
    
    if (!levelNumber || isNaN(levelNumber) || levelNumber < 1 || levelNumber > 10) {
      return res.status(400).json({
        success: false,
        message: 'Valid level number (1-10) is required'
      });
    }

    const cycles = await BreathworkCycle.getCyclesByLevel(parseInt(levelNumber))
      .select('-__v');

    if (!cycles || cycles.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Level ${levelNumber} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Cycles for Level ${levelNumber} retrieved successfully`,
      data: cycles,
      count: cycles.length,
      levelInfo: {
        levelNumber: parseInt(levelNumber),
        difficultyLevel: cycles[0].difficultyLevel,
        totalCycles: cycles.length,
        timing: {
          inhale: cycles[0].inhaleSeconds,
          hold: cycles[0].holdSeconds,
          exhale: cycles[0].exhaleSeconds,
          total: cycles[0].totalSeconds
        }
      }
    });
  } catch (error) {
    console.error('Error fetching cycles by level:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get cycles in a range
 * @route GET /api/breathwork/cycles/range/:start/:end
 * @access Public
 */
const getCyclesInRange = async (req, res) => {
  try {
    const { start, end } = req.params;
    
    if (!start || !end || isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        success: false,
        message: 'Valid start and end cycle numbers are required'
      });
    }

    const startNum = parseInt(start);
    const endNum = parseInt(end);

    if (startNum < 1 || endNum > 60 || startNum > endNum) {
      return res.status(400).json({
        success: false,
        message: 'Invalid range. Start must be 1-60, end must be 1-60, and start must be <= end'
      });
    }

    const cycles = await BreathworkCycle.getCyclesInRange(startNum, endNum)
      .select('-__v');

    res.status(200).json({
      success: true,
      message: `Cycles ${start}-${end} retrieved successfully`,
      data: cycles,
      count: cycles.length,
      range: {
        start: startNum,
        end: endNum,
        totalCycles: cycles.length
      }
    });
  } catch (error) {
    console.error('Error fetching cycles in range:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get current cycle info for a user's progress
 * @route GET /api/breathwork/current-cycle/:cycleNumber
 * @access Public
 */
const getCurrentCycleInfo = async (req, res) => {
  try {
    const { cycleNumber } = req.params;
    
    if (!cycleNumber || isNaN(cycleNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Valid cycle number is required'
      });
    }

    const cycle = await BreathworkCycle.findOne({ 
      cycleNumber: parseInt(cycleNumber),
      isActive: true 
    }).select('-__v');

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: `Cycle ${cycleNumber} not found`
      });
    }

    // Get next cycle info
    const nextCycle = await BreathworkCycle.findOne({ 
      cycleNumber: parseInt(cycleNumber) + 1,
      isActive: true 
    }).select('cycleNumber levelNumber cycleInLevel difficultyLevel');

    // Get previous cycle info
    const prevCycle = await BreathworkCycle.findOne({ 
      cycleNumber: parseInt(cycleNumber) - 1,
      isActive: true 
    }).select('cycleNumber levelNumber cycleInLevel difficultyLevel');

    res.status(200).json({
      success: true,
      message: 'Current cycle info retrieved successfully',
      data: {
        current: cycle,
        next: nextCycle,
        previous: prevCycle,
        progress: {
          totalCycles: 60,
          currentCycle: cycle.cycleNumber,
          progressPercentage: Math.round((cycle.cycleNumber / 60) * 100)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching current cycle info:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllCycles,
  getCycleByNumber,
  getCyclesByLevel,
  getCyclesInRange,
  getCurrentCycleInfo
}; 