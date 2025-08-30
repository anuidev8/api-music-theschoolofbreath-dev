const Project = require("../models/music.model");
const fs = require("fs");
const axios = require("axios");
const Music = require("../models/music.model");
const ENROLLED_TAG = process.env.ENROLLED_TAG
const Category = require('../models/categories.model')
exports.getOne = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const projects = await Project.find();
    const data = await Project.findById(slug);
    

    return res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {



    // Save music details in MongoDB
    const music = new Music({
        // Add other music details here, e.g., title, artist
        name: req.body.name,
        categories:req.body.categories,
        description:req.body.description,
        audioFilename: req.body.audioFilename,
        imageFilename:req.body.imageFilename,
        isPremium:req.body.isPremium,
        typeContent:req.body.typeContent
    });

    await music.save();

    res.status(200).send({
        message: 'Music uploaded and saved successfully.',
      
    });
} catch (error) {
    return res.status(500).send({ message: error.message });
}
}
exports.editMusicItem = async (req, res) => {
  try {
      const { musicId } = req.params; // Music item's ID from URL parameter
      const musicItem = await Music.findById(musicId);
      const updateData = {
        name: req.body.name,
        categories: req.body.categoryId,
        description: req.body.description,
        isPremium:req.body.isPremium === 'true',
        typeContent:req.body.typeContent,
        audioFilename: req.body.audioFilename,
        imageFilename:req.body.imageFilename
       
    }
      if (!musicItem) {
          return res.status(404).send({message: 'Music item not found.'});
      }



      // Save the updated music item in the database
      const updatedMusic = await Music.findByIdAndUpdate(musicId, updateData, { new: true });

      res.status(200).send({
          message: 'Music item updated successfully.',
          data: updatedMusic,
      });
  } catch (error) {
      res.status(500).send({ message: error.message });
  }
};
exports.getAll = async (req, res, next) => {
  try {
   
    const data = await Project.aggregate([
      {
        $addFields: {
          isFavorite: {
            $cond: { if: { $in: [req.user._id, '$favorites'] }, then: 1, else: 0 }
          }
        }
      },
      { $sort: { isFavorite: -1 } },
      { $project: { sections: false } }
    ]);
    return res.status(200).json({ info: "OK", success: true, data: data });
  } catch (error) {
    next(error);
  }
};

exports.getAllAdmin = async (req, res, next) => {
  try {
   
    const data =  await Project.find()
    return res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllFavorites = async (req, res, next) => {
  try {
    const favorites = await Project.find({ favorites: req.user._id })
    return res.status(200).json({ data: favorites, success: true, info: "OK" })
  } catch (error) {
    return res.status(200).json({ data: favorites, success: true, info: "OK" })
  }
}

const filterByName = (array,name) =>{
  const filter = array.filter(item => item.name === name)
  return filter.length > 0 ? true : false
}

exports.getMusicsByCategory = async (req, res, next) => {
  try {
    const { category } = req.query;
    const userEmail = req.user.email;
    const userPromotionDays = req.user.promotionDays; // Assuming this is where promotion days are stored


     // First, get the shakra category ObjectId
    const shakraCategory = await Category.findOne({ name: 'shakra' });
    if (!shakraCategory) {
      return res.status(404).json({ message: "Shakra category not found in system" });
    }
    const response = await axios.get(`https://api.systeme.io/api/contacts?email=${userEmail}`, {
      headers: {
        'x-api-key': process.env.API_SYSTEME_KEY // Replace with the actual API key
      }
    });

    const contacts = response.data?.items[0] ?? null;
    const contactWithTag = contacts ? filterByName(contacts.tags, 'Enrolled_to_Membership') : null;

    
    let isPremium = true; // Default to true, change based on conditions below

        // Base query that excludes 'app' type content and shakra category
        let query = {
          $and: [
            {
              $or: [
                { typeContent: { $exists: false } },
                { typeContent: { $ne: 'app' } }
              ]
            },
            { categories: { $ne: shakraCategory._id } }  // Always exclude shakra category
          ]
        };
    
        // If a specific category is requested
        if (category) {
          const requestedCategory = await Category.findOne({ name: category });
          if (requestedCategory) {
            // Add the category filter while maintaining shakra exclusion
            query.$and.push({ categories: requestedCategory._id });
          }
        }

    // Initialize musicList array
    let musicList = [];

    // Check user's promotion days and contactWithTag status
    if (userPromotionDays < 7) {
      // If promotion days are less than 7, show all music
      musicList = await Project.find(query).populate('categories');
    } else {
      // If promotion days are more than 7
      if (contactWithTag) {
        // If contact has tag, show all music
        musicList = await Project.find(query).populate('categories');
      } else {
        // If contact does not have tag, show only 3 non-premium music
        //query.isPremium = false; // Only fetch non-premium music
        musicList = await Project.find(query).populate('categories')
        isPremium = false; // Set isPremium to false as we are fetching non-premium music
      }
    }

    return res.status(200).json({ musicList, isPremium });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

exports.getAllFavoritesByCategory = async (req, res, next) => {
  try {
    const { category } = req.query; // Get the category from query parameters
    const userEmail = req.user.email;
    const userId = req.user._id
    const userPromotionDays = req.user.promotionDays; // Assuming this is where promotion days are stored
   
    const response = await axios.get(`https://api.systeme.io/api/contacts?email=${userEmail}`, {
      headers: {
        'x-api-key': process.env.API_SYSTEME_KEY // Replace with the actual API key
      }
    });

    const contacts = response.data?.items[0] ?? null;
    const contactWithTag = contacts ? filterByName(contacts.tags, 'Enrolled_to_Membership') : null;


   
    let query = {
      favorites: userId,
      $or: [
        { typeContent: { $exists: false } },
        { typeContent: { $ne: 'app' } }
      ]
    };
    let isPremium = true; // Default to true, change based on conditions below
    if (category) {
        // Assuming 'category' is the ObjectId or name of the category
        query.categories = { $in: [category] };
    }

    // Initialize musicList array
    let musicList = [];

    // Check user's promotion days and contactWithTag status
    if (userPromotionDays < 7) {
      // If promotion days are less than 7, show all music
      musicList = await Project.find(query).populate('categories');
    } else {
      // If promotion days are more than 7
      if (contactWithTag) {
        // If contact has tag, show all music
        musicList = await Project.find(query).populate('categories');
      } else {
        // If contact does not have tag, show only 3 non-premium music
        
        musicList = await Project.find(query).populate('categories')
        isPremium = false; // Set isPremium to false as we are fetching non-premium music
      }
    }

    return res.status(200).json({ musicList, isPremium });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

 
exports.position = async (req, res, next) => {
  try {
    const { id, position } = req.params;
    const project = await Project.findById(id);
    if (!project || !project._id)
      return res
        .status(400)
        .json({ success: false, info: "Project not found", data: {} });
    const positionNow = project.position;
    const projects = await Project.find({
      $or: [{ position: project.position }, { position: position }],
    });

    for (const key in projects) {
      if (Object.hasOwnProperty.call(projects, key)) {
        if (projects[key].position == positionNow) {
          projects[key].position = position;
          await projects[key].save();
        } else if (projects[key].position == position) {
          projects[key].position = positionNow;
          await projects[key].save();
        }
      }
    }

    const data = await Project.find()
      .sort({ position: 1 })
      .select({ sections: false });
    return res.status(200).json({ data: data, success: true, info: "OK" });
  } catch (error) {
    next(error);
  }
};
