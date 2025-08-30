const chatService = require('../../services/chatService');
const Topic = require('../../models/topic.model');
const FAQ = require('../../models/faq.model');
const ListenQuestion = require('../../models/listenQuestion.model');

exports.topics = async (req, res, next) => {
    try {
        const TOPICS = await Topic.find().sort({ id: 1 });
        res.status(200).json(TOPICS);
    } catch (error) {
        return next(error);
    }
};

// Get FAQ data by topic from MongoDB
exports.getFaqByTopic = async (req, res, next) => {
    try {
        const category = req.params.category;
      
        // Validate the category exists in our Topic collection
      
        const topicExists = await Topic.findOne({ category: category });
        if (!topicExists) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Get FAQs from MongoDB
        const faqData = await FAQ.find({ category: category }).sort({ createdAt: -1 });
        
        res.status(200).json(faqData);
    } catch (error) {
        return next(error);
    }
};

// Chat endpoint - Process user questions with FAQ integration and guide support
exports.chat = async (req, res, next) => {
    try {
        const { message, userId, userEmail, sessionId, selectedGuide } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Determine user identifier - prefer userId if available, otherwise use userEmail
        const userIdentifier = userId || userEmail;

        // Use selected guide or default to 'abhi'
        const guideId = selectedGuide || 'abhi';

        const metadata = {
            ...req.metadata,
            platform: req.get('platform') || 'unknown',
            deviceType: req.get('device-type') || 'unknown'
        };

        const result = await chatService.processMessage(
            message, 
            userIdentifier, 
            sessionId,
            metadata,
            guideId
        );

        res.status(200).json({
            ...result.response,
            sessionId: result.sessionId,
            selectedGuide: result.selectedGuide,
            shortcuts: result.response.shortcuts || []
        });

    } catch (error) {
        return next(error);
    }
};

// Get conversation history
exports.getConversationHistory = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { userId, userEmail, limit } = req.query;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        // Determine user identifier - prefer userId if available, otherwise use userEmail
        const userIdentifier = userId || userEmail;

        const history = await chatService.getConversationHistory(
            sessionId,
            userIdentifier || null,
            limit ? parseInt(limit) : 50
        );

        res.status(200).json(history);
    } catch (error) {
        return next(error);
    }
};

// Get user sessions
exports.getUserSessions = async (req, res, next) => {
    try {
        const { userId, userEmail, activeOnly } = req.query;

        // Determine user identifier - prefer userId if available, otherwise use userEmail
        const userIdentifier = userId || userEmail;

        if (!userIdentifier) {
            return res.status(400).json({ error: 'User ID or Email is required' });
        }

        const sessions = await chatService.getUserSessions(
            userIdentifier,
            activeOnly === 'true'
        );

        res.status(200).json(sessions);
    } catch (error) {
        return next(error);
    }
};

// Get session guide information
exports.getSessionGuideInfo = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const guideInfo = await chatService.getSessionGuideInfo(sessionId);
        res.status(200).json(guideInfo);
    } catch (error) {
        if (error.message === 'Session not found') {
            return res.status(404).json({ error: 'Session not found' });
        }
        return next(error);
    }
};

// Get analytics
exports.getAnalytics = async (req, res, next) => {
    const { userId } = req.query;

    try {
        // Get both chat analytics and FAQ analytics
        const chatAnalytics = await chatService.getAnalytics(userId || null);
        
        // Add FAQ-specific analytics
        const faqAnalytics = {
            totalFAQs: await FAQ.countDocuments(),
            byCategory: await FAQ.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]),
            mostViewed: await FAQ.find().sort({ views: -1 }).limit(5)
        };

        res.status(200).json({
            ...chatAnalytics,
            faqAnalytics
        });
    } catch (error) {
        console.error('Error retrieving analytics:', error);
        res.status(500).json({ error: 'Failed to retrieve analytics' });
    }
};


exports.listenQuestion = async (req, res, next) => {
    try {

        const { faqId } = req.body;
        const { userEmail } = req.query;
        
        if (!userEmail) {
            return res.status(400).json({ error: 'User ID and FAQ ID are required' });
        }
        
        // Create or update the listen question record
        const listenQuestion = await ListenQuestion.findOneAndUpdate(
            { userId: userEmail , faqId },
            { $inc: { count: 1 } },
            { upsert: true, new: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'Listen question recorded successfully',
            data: listenQuestion
        });
    } catch (error) {
        return next(error);
    }
};




// Seed FAQs from the static data (one-time operation)
exports.seedFAQs = async (req, res, next) => {
    try {
        const { 
            getGeneralFAQs, 
            getMembershipFAQs, 
            getCourseFAQs, 
            getAppFAQs, 
            getTechnicalFAQs 
        } = require('../../data/faqData');

        // Delete existing FAQs
        await FAQ.deleteMany({});

        // Prepare FAQ data with categories
        const faqsToInsert = [
            ...getGeneralFAQs().map(faq => ({ ...faq, category: 'general' })),
            ...getMembershipFAQs().map(faq => ({ ...faq, category: 'membership' })),
            ...getCourseFAQs().map(faq => ({ ...faq, category: 'course' })),
            ...getAppFAQs().map(faq => ({ ...faq, category: 'app' })),
            ...getTechnicalFAQs().map(faq => ({ ...faq, category: 'technical' }))
        ];

        // Insert all FAQs
        const result = await FAQ.insertMany(faqsToInsert);

        res.status(200).json({
            message: 'FAQs seeded successfully',
            count: result.length
        });
    } catch (error) {
        return next(error);
    }
};