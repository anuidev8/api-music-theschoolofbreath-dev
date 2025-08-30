const controller = require("../../controllers/chat/chat.controller")

const express = require("express");
const router = express.Router();

// Chat endpoint
router.route("/").post(controller.chat)

// Get conversation history
router.route("/history/:sessionId").get(controller.getConversationHistory)

// Get user sessions
router.route("/sessions").get(controller.getUserSessions)

// Get session guide information
router.route("/session/:sessionId/guide").get(controller.getSessionGuideInfo)

// Get analytics
router.route("/analytics").get(controller.getAnalytics)

// Topics endpoint
router.route("/topics").get(controller.topics)

// Get FAQ by topic
router.route("/faq/:category").get(controller.getFaqByTopic)

// Listen question endpoint
router.route("/listen-question").post(controller.listenQuestion)

// Seed FAQs endpoint
router.route("/seed-faqs").post(controller.seedFAQs)

module.exports = router;

