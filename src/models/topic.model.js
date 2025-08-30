const mongoose = require('mongoose');


const TopicSchema = new mongoose.Schema({
    id: Number,
    title: String,
    color: String,
    category: String
})

module.exports = mongoose.model('Topic', TopicSchema)
