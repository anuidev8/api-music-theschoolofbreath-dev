// services/chatService.js
const ChatHistory = require('../models/chat.model');
const { v4: uuidv4 } = require('uuid');
const { handleUserQuestion } = require('../utils//qaHandler copy');

class ChatService {
  /**
   * Process a user message and store the interaction
   * @param {string} message - The user's message
   * @param {string} userId - The user ID (optional for anonymous users)
   * @param {string} sessionId - The session ID (will be created if not provided)
   * @param {object} metadata - Additional metadata about the request
   * @returns {object} - The response and session information
   */
  async processMessage(message, userId = null, sessionId = null, metadata = {}) {
    // Create or use provided session ID
    const currentSessionId = sessionId || uuidv4();
    
    try {
      // Get or create the chat history for this session
      const chatHistory = await ChatHistory.findOrCreateSession(userId, currentSessionId);
      
      // Update metadata if provided
      if (Object.keys(metadata).length > 0) {
        chatHistory.metadata = {
          ...chatHistory.metadata,
          ...metadata,
          lastActive: new Date()
        };
        await chatHistory.save();
      }
      
      // Add the user message to history
      const userMessage = {
        text: message,
        isUser: true,
        source: 'user',
        createdAt: new Date()
      };
      await chatHistory.addMessage(userMessage);
      
      // Process the user's question
      const botResponse = await handleUserQuestion(message);
      
      // Add the bot response to history
      const botMessage = {
        text: botResponse.answer,
        isUser: false,
        hasAudio: true,
        backgroundColor: botResponse.backgroundColor,
        source: botResponse.source || 'local', // Track if answer came from knowledge base or OpenAI
        createdAt: new Date()
      };
      await chatHistory.addMessage(botMessage);
      
      // Return the response and session info
      return {
        sessionId: currentSessionId,
        response: {
          id: Date.now().toString(),
          text: botResponse.answer,
          isUser: false,
          hasAudio: true,
          backgroundColor: botResponse.backgroundColor
        },
        isNewSession: !sessionId // Flag if this was a new session
      };
    } catch (error) {
      console.error('Error processing message:', error);
      throw error;
    }
  }
  
  /**
   * Get conversation history for a session
   * @param {string} sessionId - The session ID
   * @param {string} userId - The user ID (optional)
   * @param {number} limit - Maximum number of messages to retrieve
   * @returns {array} - Array of messages
   */
  async getConversationHistory(sessionId, userId = null, limit = 50) {
    try {
      const query = { sessionId };
      if (userId) query.userId = userId;
      
      const chatHistory = await ChatHistory.findOne(query);
      if (!chatHistory) return [];
      
      // Get messages with optional limit
      return limit ? chatHistory.messages.slice(-limit) : chatHistory.messages;
    } catch (error) {
      console.error('Error retrieving conversation history:', error);
      throw error;
    }
  }
  
  /**
   * Get all sessions for a user
   * @param {string} userId - The user ID
   * @param {boolean} activeOnly - If true, only return active sessions
   * @returns {array} - Array of sessions
   */
  async getUserSessions(userId, activeOnly = false) {
    try {
      if (activeOnly) {
        return ChatHistory.findActiveSessionsForUser(userId);
      } else {
        return ChatHistory.find({ userId }).sort({ updatedAt: -1 });
      }
    } catch (error) {
      console.error('Error retrieving user sessions:', error);
      throw error;
    }
  }
  
  /**
   * Run analytics on chat history
   * @param {string} userId - Optional user ID to filter analytics
   * @returns {object} - Analytics data
   */
  async getAnalytics(userId = null) {
    try {
      const analytics = {
        topQuestions: await ChatHistory.getTopQuestions(10)
      };
      
      // If userId is provided, get user-specific stats
      if (userId) {
        const userSessions = await ChatHistory.find({ userId });
        
        // Count total messages for this user
        let messageCount = 0;
        userSessions.forEach(session => {
          messageCount += session.messages.length;
        });
        
        analytics.userStats = {
          sessionCount: userSessions.length,
          messageCount: messageCount,
          averageMessagesPerSession: userSessions.length > 0 ? 
            messageCount / userSessions.length : 0
        };
      }
      
      return analytics;
    } catch (error) {
      console.error('Error generating analytics:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();