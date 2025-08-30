const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");


/**
 * Video Content Schema
 * @private
 */
const VideoContent = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['mantra', 'youtube'],
      required: true
    },
    position: {
      type: Number,
      default: 0,
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    views: {
      type: Number,
      default: 0,
    },
   
  },
  {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
  }
);

// Add pagination plugin for large video collections
VideoContent.plugin(mongoosePaginate);

// Middleware to increment views on find operations
VideoContent.post("findOne", async function (result) {
  if (result) {
    result.views += 1;
    await result.save();
  }
});

// Virtual for getting most viewed videos
VideoContent.virtual("moreViewed").get(async function () {
  try {
    const VideoContent = this.model("VideoContent");
    const mostViewed = await VideoContent.find({})
      .sort({ views: -1 })
      .limit(5)
      .lean();
    return mostViewed;
  } catch (error) {
    return [];
  }
});

const VideoContentSchema = model("VideoContent", VideoContent);
module.exports = VideoContentSchema;