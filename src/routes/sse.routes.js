const express = require('express');
const router = express.Router();

// Map to hold active SSE connections per user
const clients = new Map();

/**
 * SSE endpoint for subscribing to real-time events
 * @route GET /eventos/subscribe/:userEmail
 */
router.get('/subscribe/:userEmail', (req, res) => {
  const userEmail = req.params.userEmail;

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.flushHeaders(); // required for streaming to start

  console.log(`✅ Client connected: ${userEmail}`);
  
  clients.set(userEmail, res); // <--- this is important!

  req.on('close', () => {
    console.log(`❌ Client disconnected: ${userEmail}`);
    clients.delete(userEmail);
  });
});
router.post("/notify", async (req, res) => {
    const { userEmail, tipo,feedback } = req.body;

    if (!userEmail ) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
  await  sendNotificationToUser(userEmail, {
      tipo,
      mensaje: feedback,
    });
    return res.status(200).json({ success: true, sentTo: userEmail });
  });
/**
 * Utility function to send notifications to specific users
 * @param {string} userEmail - The email of the user to notify
 * @param {Object} data - The data to send to the user
 */
function sendNotificationToUser(userEmail, data) {
  const res = clients.get(userEmail);
  if (res) {
    console.log(`🔔 Sending to ${userEmail}:`, data);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } else {
    console.warn(`⚠️ No active connection for ${userEmail}`);
  }
}

module.exports = {
  router,
  sendNotificationToUser
}; 