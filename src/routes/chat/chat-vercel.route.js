const { Router } = require("express");
const { authorize} = require("../../utils/auth");
const { handleChat } = require("../../services/chatServiceVercel");
const chatService = require('../../services/chatService');

const router = Router();

router.post('/chat', async (req, res,next) => {
  try {
        const { message, userId, sessionId } = req.body;
  
        if (!message || !message.trim()) {
          return res.status(400).json({ error: 'Message is required' });
        }
        
      
          // Extract useful metadata from the request
          const metadata = {
            ...req.metadata,
            platform: req.get('platform') || 'unknown',
            deviceType: req.get('device-type') || 'unknown'
          };
          
          // Process message and store in MongoDB
          const result = await handleChat({ userId, prompt: message, sessionId, metadata });
          
          res.status(200).json({
            ...result.response,
            sessionId: result.sessionId
          });
      
    } catch (error) {
      return next(error);
    }
});

module.exports = router;
