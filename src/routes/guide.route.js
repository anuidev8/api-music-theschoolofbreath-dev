const express = require('express');
const router = express.Router();
const controller = require('../controllers/guide.controller');

// Get all active guides
router.get('/', controller.getAllGuides);

// Get all resources from all guides
router.get('/resources/all', controller.getAllGuidesResources);

// Get guide by ID
router.get('/:guideId', controller.getGuideById);

// Get guide resources (GIFs for different states)
router.get('/:guideId/resources', controller.getGuideResources);

// Select guide for a session
router.post('/select', controller.selectGuide);

// Get specific resource by name
router.get('/:guideId/resources/:resourceName', controller.getResourceByName);

// Add new resource to guide
router.post('/:guideId/resources', controller.addResource);

// Update existing resource
router.put('/:guideId/resources/:resourceName', controller.updateResource);

// Remove resource from guide
router.delete('/:guideId/resources/:resourceName', controller.removeResource);

// Seed default guides (admin endpoint)
router.post('/seed', controller.seedGuides);

module.exports = router; 