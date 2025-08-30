const { randomUUID } = require('crypto');
const { streamText,generateText } = require('ai');
const { openai } = require('@ai-sdk/openai');
const MessageModel = require('../models/chat.model');
const { recommendCourseTool } = require('./tools');
const { cleanResponse } = require('../utils/qaHandler');

module.exports.handleChat = async ({ userId, prompt, sessionId }) => {
  const newSessionId = sessionId || randomUUID();

  const history = await MessageModel.find({ userId, sessionId: newSessionId }).sort({ createdAt: 1 }).lean();

  const messages = [
    { role: 'system', content: 'You are Abhi, a 43-year-old mental health expert and founder of Meditate with Abhi and The School of Breath. You blend ancient yogic wisdom with modern neuroscience. Keep responses concise, warm, and focused on meditation, breathwork, and wellness.' },
    ...history.map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: prompt },
  ];

  const result = await generateText({
    model: openai('gpt-4o'),
    messages,
    tools: [recommendCourseTool], // ✅ Pass your tools here
  });

  let fullResponse = '';
  // Extract the text content from the result
  if (result.text) {
    fullResponse = result.text;
  }
  
  console.log('AI Result:', result);
  console.log('Full Response:', fullResponse);

  // Clean the response using the same function as the main chat service
  const cleanedResponse = cleanResponse(fullResponse);

  return { 
    response: cleanedResponse, 
    sessionId: newSessionId 
  };
};
