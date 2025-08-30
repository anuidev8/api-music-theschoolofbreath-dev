const { Schema, model } = require("mongoose");
const removeSpecialChars = require("../utils/slugify");

const Category = new Schema(
  {
    name: {
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
    type: {
      type: String,
      enum: ['video', 'music'],
      required: true // Optional, depending on whether you want this field to be mandatory
    },
   
  },
 
);


const CategorySchema = model("Category", Category);

module.exports = CategorySchema;
