// models/chatHistory.js
const mongoose = require('mongoose');

// Schema for individual messages within a conversation
const messageSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true 
  },
  isUser: { 
    type: Boolean, 
    required: true 
  },
  hasAudio: { 
    type: Boolean, 
    default: false 
  },
  backgroundColor: { 
    type: String, 
    default: "#E8D1D1" 
  },
  source: { 
    type: String, 
    enum: ['local', 'openai', 'user'], 
    required: true 
  },
  shortcuts: {
    type: [String],
    default: []
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Main chat history schema with conversation tracking
const chatHistorySchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: false, 
    index: true // Indexed for faster queries by user
  },
  sessionId: { 
    type: String, 
    required: true, 
    index: true // Indexed for faster retrieval of specific sessions
  },
  messages: [messageSchema],
  metadata: {
    userAgent: String,
    ipAddress: String,
    platform: String,
    deviceType: String,
    selectedGuide: {
      type: String,
      enum: ['abhi', 'ganesha'],
      default: 'abhi'
    },
    guidePersonality: {
      type: String,
      default: 'modern'
    },
    lastActive: { 
      type: Date, 
      default: Date.now 
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: true // Indexed for time-based queries
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add TTL index to automatically expire old chat histories after 180 days (configurable)
chatHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

// Update the updatedAt field on save
chatHistorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add methods for common operations
chatHistorySchema.methods = {
  // Add a message to the conversation
  addMessage: function(message) {
    this.messages.push(message);
    this.updatedAt = Date.now();
    return this.save();
  },

  // Get all messages in the conversation
  getMessages: function() {
    return this.messages;
  },

  // Get the last N messages
  getRecentMessages: function(limit = 10) {
    return this.messages.slice(-limit);
  },

  // Update guide selection
  updateGuide: function(guideId) {
    this.metadata.selectedGuide = guideId;
    this.updatedAt = Date.now();
    return this.save();
  }
};

// Static methods for common queries
chatHistorySchema.statics = {
  // Find active sessions for a user
  findActiveSessionsForUser: function(userId) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1); // Sessions active in the last 24 hours
    
    return this.find({
      userId: userId,
      updatedAt: { $gte: cutoffDate }
    }).sort({ updatedAt: -1 });
  },

  // Find or create a session
  findOrCreateSession: async function(userId, sessionId, selectedGuide = 'abhi') {
    let session = await this.findOne({ userId, sessionId });
    
    if (!session) {
      session = new this({
        userId,
        sessionId,
        messages: [],
        metadata: {
          selectedGuide: selectedGuide
        }
      });
      await session.save();
    }
    
    return session;
  },

  // Aggregate common questions (for analytics)
  getTopQuestions: async function(limit = 10) {
    return this.aggregate([
      { $unwind: "$messages" },
      { $match: { "messages.isUser": true } },
      { $group: { 
        _id: "$messages.text", 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
  },

  // Get guide analytics
  getGuideAnalytics: async function() {
    return this.aggregate([
      { $group: { 
        _id: "$metadata.selectedGuide", 
        count: { $sum: 1 },
        totalMessages: { $sum: { $size: "$messages" } }
      }},
      { $sort: { count: -1 } }
    ]);
  }
};

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

module.exports = ChatHistory;