const express = require('express');
const router = express.Router();
const {
  getAllCycles,
  getCycleByNumber,
  getCyclesByLevel,
  getCyclesInRange,
  getCurrentCycleInfo
} = require('../controllers/breathwork.controller');

/**
 * @route   GET /api/breathwork/cycles
 * @desc    Get all breathwork cycles
 * @access  Public
 */
router.get('/cycles', getAllCycles);

/**
 * @route   GET /api/breathwork/cycle/:cycleNumber
 * @desc    Get a specific cycle by cycle number
 * @access  Public
 */
router.get('/cycle/:cycleNumber', getCycleByNumber);

/**
 * @route   GET /api/breathwork/level/:levelNumber
 * @desc    Get all cycles in a specific level
 * @access  Public
 */
router.get('/level/:levelNumber', getCyclesByLevel);

/**
 * @route   GET /api/breathwork/cycles/range/:start/:end
 * @desc    Get cycles in a range
 * @access  Public
 */
router.get('/cycles/range/:start/:end', getCyclesInRange);

/**
 * @route   GET /api/breathwork/current-cycle/:cycleNumber
 * @desc    Get current cycle info with next/previous cycle data
 * @access  Public
 */
router.get('/current-cycle/:cycleNumber', getCurrentCycleInfo);

module.exports = router; 