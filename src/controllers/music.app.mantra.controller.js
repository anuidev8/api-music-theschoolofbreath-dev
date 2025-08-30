// controllers/music.app.controller.js
// Add this new method alongside existing ones
const Music = require("../models/music.model");
const axios = require("axios");
const Category = require('../models/categories.model')
const AccessMeditationTagsConfig = require('../configs/access')
const hasAnyTag = (userTags, tagsToCheck) => {
    return tagsToCheck.some(tag => userTags.includes(tag));
  };
exports.getGuidedMeditationMusicByCategory = async (req, res, next) => {
    try {
      const userEmail = req.query.email;
      
      // First, get the guided meditation category ObjectId
      const guidedMeditationCategory = await Category.findOne({ name: 'guided meditation' });
      if (!guidedMeditationCategory) {
        return res.status(404).json({ message: "Guided meditation category not found in system" });
      }
  
      let userTags = [];
     if(userEmail){
        try {
            // Get user tags from Systeme.io
            const response = await axios.get(`https://api.systeme.io/api/contacts?email=${userEmail}`, {
              headers: {
                'x-api-key': process.env.API_SYSTEME_KEY,
              },
            });
            const contacts = response.data?.items[0] ?? null;
            userTags = contacts ? contacts.tags.map(tag => tag.name) : [];
          } catch (error) {
            console.error('Error fetching user tags:', error);
            userTags = [];
          }
     }
  
      // Base query for Guided Meditation music
      let query = {
        typeContent: 'app',
        categories: guidedMeditationCategory._id
      };
      
      let isPremium = true;
      let musicList = [];
  
      const hasFullAccess = hasAnyTag(userTags, AccessMeditationTagsConfig.fullAccessTagsForGuidedMeditation);
      const hasLimitedAccess = hasAnyTag(userTags, AccessMeditationTagsConfig.limitedAccessTagsGuidedMeditation);
  
      if (hasFullAccess || hasLimitedAccess) {
        // Full access members can see all Guided Meditation music
        musicList = await Music.find(query).populate('categories');
      } else {
        // Non-members see only non-premium Guided Meditation music
        musicList = await Music.find(query).populate('categories');
        isPremium = false;
      }
  
      // Add total count to response
      const totalCount = musicList.length;
  
      // Optional: Add pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
  
      const paginatedMusic = musicList.slice(startIndex, endIndex);
  
      return res.status(200).json({
        musicList: paginatedMusic,
        isPremium,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      });
  
    } catch (error) {
      console.error('Error in getGuidedMeditationMusicByCategory:', error);
      res.status(500).json({
        message: 'Failed to fetch Guided Meditation music',
        error: error.message
      });
    }
  };