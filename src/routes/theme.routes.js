// routes/themeRoutes.js
const express = require('express');
const router = express.Router();
const themeController = require('../controllers/theme.controller');

router.get('/', themeController.getThemes);
router.post('/', themeController.createTheme);
router.get('/:id', themeController.getThemeById);
router.put('/:id', themeController.updateTheme);
router.delete('/:id', themeController.deleteTheme);

module.exports = router;