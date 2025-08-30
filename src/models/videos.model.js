const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const removeSpecialChars = require("../utils/slugify");

/**
 * Countries Schema
 * @private
 */
const Video = new Schema(
  {
    name: {
      type: String,
      default: "",
    },
    description:{
      type: String,
      default: "",
    },
    slug: {
      type: String,
      default: function () {
        let text = removeSpecialChars(this.name);
        return text;
      },
    },
    position: {
      type: Number,
      default: 0,
    },
    favorites: [{ type: Schema.Types.ObjectId, ref: "User" }],
    videoFilename: String,
    imageFilename: String,
    categories:[{type:Schema.Types.ObjectId, ref: 'Category' }]
  },
  {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
  }
);


const VideoSchema = model("Video",Video );

module.exports = VideoSchema;
