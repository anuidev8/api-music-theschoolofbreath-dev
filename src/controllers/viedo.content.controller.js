const VideoContent = require("../models/video.content.model");
const axios = require("axios");

const fullAccessTagsVideo = [
  'Enrolled_to_Membership',
  'Enrolled_Holistic Membership',

];


const hasAnyTag = (userTags, tagsToCheck) => {
  return tagsToCheck.some(tag => userTags.includes(tag));
};
exports.createVideoContent = async (req, res) => {
  try {
    const { title, description, videoUrl, type, thumbnailUrl } = req.body;

    const content = new VideoContent({
      title,
      description,
      videoUrl,
      type,
      thumbnailUrl
    });

    await content.save();
    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET FOR APP 


// controllers/video-content.controller.js
exports.getVideos = async (req, res) => {
  try {
    const { type } = req.query;
    const userEmail = req.query.email;

    // Base query
    const query = {};
    if (type) {
      query.type = type;
    }

    try {
      // Get all videos first
      const videoList = await VideoContent.find(query)
        .sort({ position: 1, createdAt: -1 });

      let hasAccess = false;

      if (userEmail) {
        try {
          const response = await axios.get(`https://api.systeme.io/api/contacts?email=${userEmail}`, {
            headers: {
              'x-api-key': process.env.API_SYSTEME_KEY
            },
          });

          const contacts = response.data?.items[0] ?? null;
          const userTags = contacts ? contacts.tags.map(tag => tag.name) : [];

          const hasFullAccess = hasAnyTag(userTags, fullAccessTagsVideo);     
          hasAccess = hasFullAccess 
        } catch (error) {
          console.error('Error checking access:', error);
          hasAccess = false;
        }
      }

      // Add total count
      const totalCount = videoList.length;

      // Add pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const paginatedVideos = videoList.slice(startIndex, endIndex);

      return res.status(200).json({
        videoList: paginatedVideos,
        hasAccess,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      });

    } catch (error) {
      console.error('Error in video fetch:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching videos',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Error in getVideos:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch videos',
      error: error.message
    });
  }
};


// GET FOR ADMIN
exports.getAllVideoContent = async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (type) {
      query.type = type;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { position: 1, createdAt: -1 }
    };

    const content = await VideoContent.paginate(query, options);
    
    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getVideoContentById = async (req, res) => {
  try {
    const content = await VideoContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found"
      });
    }

    // Increment views
    content.views += 1;
    await content.save();

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateVideoContent = async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoItem = await VideoContent.findById(videoId);

    if (!videoItem) {
      return res.status(404).send({ message: 'Video content not found.' });
    }

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      videoUrl: req.body.videoUrl,
      thumbnailUrl: req.body.thumbnailUrl,
      type: req.body.type,
      isPremium: req.body.isPremium,
      isActive: req.body.isActive
    };

    // Save the updated video content in the database
    const updatedVideo = await VideoContent.findByIdAndUpdate(
      videoId, 
      updateData,
      { new: true }
    );

    res.status(200).send({
      message: 'Video content updated successfully.',
      data: updatedVideo,
    });
  } catch (error) {
    res.status(500).send({ 
      message: error.message,
      success: false
    });
  }
};

exports.deleteVideoContent = async (req, res) => {
  try {
    const content = await VideoContent.findByIdAndDelete(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Content deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updatePosition = async (req, res) => {
  try {
    const { items } = req.body;
    
    for (const item of items) {
      await VideoContent.findByIdAndUpdate(item.id, {
        position: item.position
      });
    }

    res.status(200).json({
      success: true,
      message: "Positions updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.toggleFavorite = async (req, res) => {
  try {
    const content = await VideoContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found"
      });
    }

    const userId = req.user._id;
    const isFavorited = content.favorites.includes(userId);

    if (isFavorited) {
      content.favorites = content.favorites.filter(id => id.toString() !== userId.toString());
    } else {
      content.favorites.push(userId);
    }

    await content.save();

    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};