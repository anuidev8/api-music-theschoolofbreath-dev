const {Schema} = require('mongoose');
const mongoose = require('mongoose');

const  listenQuestionSchema = new Schema({
    userId: { type: String, required: true },
    faqId: { type: Schema.Types.ObjectId, ref: 'FAQ', required: true },
    count: { type: Number, default: 1 },
});

const listenQuestion = mongoose.model('listenQuestion', listenQuestionSchema);

module.exports = listenQuestion;
