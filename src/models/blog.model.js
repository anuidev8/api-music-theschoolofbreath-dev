const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const removeSpecialChars = require("../utils/slugify");
/**
 * Countries Schema
 * @private
 */
const Blog = new Schema(
  {
    title: {
      type: String,
      default: "",
    },
    titleIn: {
      type: String,
      default: "",
    },
    poster: String,
    video: String,
    description: String,
    blogType: String,
    descriptionIn: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      default: function () {
        let text = removeSpecialChars(this.title);
        return text;
      },
    },
    position: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    author:{
      type: String,
      default: "anonymous",
    },
    date:{
      type:Date,
      required: true
    },
    images: [
      {
        image: {
          type: String,
        },
        description: {
          type: String,
        },
        descriptionIn: {
          type: String,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true },
  }
);
Blog.virtual("beforeAndAfter");
Blog.virtual("quantity");
Blog.virtual("moreViewed");

Blog.post("find", async function (results) {
  try {
    for (const result of results) {
      // await result.getPoints()
      let numbers = [];

      for (let i = 1; i <= results.length; i++) {
        numbers.push(i);
      }
      await result.set("quantity", numbers);
    }
  } catch (error) {}
});

Blog.post("findOne", async function (result) {
  try {
    if (result) {
      const Blog = this.model; // Get the Blog model
      const leastViewedBlogs = await Blog.find({})
        .sort({ views: 1 })
        .limit(7)
        .lean();

      result.set("moreViewed", leastViewedBlogs);
    }
  } catch (error) {}
});
Blog.plugin(mongoosePaginate);
const BlogSchema = model("Blog", Blog);
module.exports = BlogSchema;
