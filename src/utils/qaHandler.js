// utils/qaHandler.js - OpenAI Assistant implementation
const axios = require('axios');
const guideService = require('../services/guideService');

// OpenAI Assistant configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = 'asst_f2WLBYRHz7OUUwPMn69U1x1p';

const OPENAI_HEADERS = {
  'Authorization': `Bearer ${OPENAI_API_KEY}`,
  'Content-Type': 'application/json',
  'OpenAI-Beta': 'assistants=v2'
};

// Delay helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Clean response function to remove markdown and formatting
function cleanResponse(answer) {
  console.log('Cleaning response:', answer);
  return answer
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
    .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*
    .replace(/##\s*/g, '')           // Remove ## headers
    .replace(/#\s*/g, '')            // Remove # headers
    .replace(/-\s*/g, '')            // Remove - lists
    
    // Remove source citations and references
    .replace(/【[^】]*】/g, '')        // Remove 【】 brackets and content
    .replace(/\[[^\]]*\]/g, '')      // Remove [] brackets and content
    .replace(/\([^)]*\)/g, '')       // Remove () brackets and content
    .replace(/†source/g, '')         // Remove †source
    .replace(/\d+:\d+†source/g, '') // Remove timestamp†source like "4:15†source"
    .replace(/\d+:\d+/g, '')        // Remove standalone timestamps
    
    // Remove extra whitespace and formatting
    .replace(/\n\s*\n/g, '\n')      // Remove extra line breaks
    .replace(/^\s+|\s+$/g, '')      // Trim whitespace
    .replace(/[🌟🌼🙏😊✨💫]/g, '') // Remove emojis
    .replace(/\s+/g, ' ')           // Normalize spaces
    
    // Clean up any remaining artifacts
    .replace(/\s+/g, ' ')           // Normalize spaces again
    .replace(/\n\s+/g, '\n')        // Clean up line start spaces
    .replace(/\s+\n/g, '\n')        // Clean up line end spaces
    .trim();
}

// Main handler function for user questions
async function handleUserQuestion(query, selectedGuide = 'abhi') {
  const lowerCaseQuery = query.toLowerCase().trim();

  // Greeting detection (partial match)
  const greetingKeywords = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"];
  if (greetingKeywords.some(greet => lowerCaseQuery.startsWith(greet))) {
    const greetings = [
      "Hello there! How can I help you today?",
      "Hi! What's on your mind?",
      "Hey! Ask me anything about The School of Breath."
    ];
    return {
      answer: greetings[Math.floor(Math.random() * greetings.length)],
      backgroundColor: "#E8D1D1",
      source: 'greeting',
      shortcuts: [
        "How do I start meditation?",
        "What breathing techniques do you recommend?",
        "Tell me about your courses"
      ]
    };
  }

  try {
    const assistantResponse = await getOpenAIResponse(query, selectedGuide);
    
    // Handle both JSON and plain text responses
    if (assistantResponse && typeof assistantResponse === 'object' && assistantResponse.shortcuts) {
      // JSON response with shortcuts
      return {
        answer: assistantResponse.answer,
        backgroundColor: "#E8D1D1",
        source: assistantResponse.source || 'openai_assistant_json',
        shortcuts: assistantResponse.shortcuts
      };
    } else {
      // Plain text response (existing logic)
      return {
        answer: assistantResponse,
        backgroundColor: "#E8D1D1",
        source: 'openai_assistant',
        shortcuts: []
      };
    }
  } catch (error) {
    console.error('Error handling question:', error.message || error);
    return {
      answer: "I apologize, but I'm having trouble processing your question right now. Please try again later.",
      backgroundColor: "#F2E8E8",
      source: 'error',
      shortcuts: []
    };
  }
}

// Get response from OpenAI Assistant
async function getOpenAIResponse(query, selectedGuide = 'abhi') {
  if (!OPENAI_API_KEY || !ASSISTANT_ID) {
    console.error('OpenAI API key or Assistant ID not found');
    return "I apologize, but I'm having trouble accessing my knowledge base right now. Please try again later.";
  }

  try {
    const guideContext = await guideService.getGuideSystemPrompt(selectedGuide);

    // 1. Create a thread with metadata (required by latest API)
    const threadRes = await axios.post('https://api.openai.com/v1/threads', {
      metadata: {
        source: 'breathwork_app',
        guide: selectedGuide,
        timestamp: new Date().toISOString()
      }
    }, { headers: OPENAI_HEADERS });
    
    if (!threadRes.data?.id) {
      throw new Error('Failed to create thread: No thread ID returned');
    }
    
    const threadId = threadRes.data.id;
    console.log('Thread created:', threadId);

    // 2. Add user message with proper content structure
    const messageRes = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        role: 'user',
        content: `Context: ${guideContext}\n\nUser Question: ${query}`
      },
      { headers: OPENAI_HEADERS }
    );
    
    if (!messageRes.data?.id) {
      throw new Error('Failed to add message: No message ID returned');
    }
    
    console.log('Message added:', messageRes.data.id);

    // 3. Run the assistant
    const runRes = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      { 
        assistant_id: ASSISTANT_ID,
        instructions: `INSTRUCTIONS:
- Always respond in JSON. Return valid JSON only (no markdown, no emojis, no citations, no file names, no timestamps).
- First, try to match against the FAQ-style knowledge base. Preferred record format:
{
  "category": "string (e.g., general, courses, practices)",
  "question": "string (FAQ-style user question)",
  "answer": "string (clear response text)",
  "keywords": ["list", "of", "related", "searchable", "terms"]
}
- If nothing matches in FAQ, consult the uploaded documents (PDF, TXT, DOCX, chunked text, embeddings, etc.) and generate the best possible answer in the SAME JSON format.
- The "question" field must repeat the user's query (or a normalized version of it).
- Keep "answer" concise (max 2-3 sentences), plain text only.
- "keywords" should help future search/discovery (3-10 concise terms).
- Add a "shortcuts" array with 2-5 related user questions that the user may want to ask next.
  - If the matched KB item contains "followUpShortcuts", relatedFaqs or "relatedFaqIds", prefer those when relevant.
  - Otherwise, generate shortcuts from semantically adjacent topics in the knowledge base or documents.
- If sources are insufficient to answer, still return the same JSON shape with a brief, honest "answer" and empty arrays for "keywords" and "shortcuts".

OUTPUT JSON SCHEMA (must match exactly):
{
  
  "answer": "string",
  "shortcuts": ["string", ...]
}`
      },
      { headers: OPENAI_HEADERS }
    );
    
    if (!runRes.data?.id) {
      throw new Error('Failed to create run: No run ID returned');
    }
    
    const runId = runRes.data.id;
    console.log('Run created:', runId);

    // 4. Poll until completion with timeout
    let runStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout
    
    while (['queued', 'in_progress'].includes(runStatus) && attempts < maxAttempts) {
      await sleep(1000);
      attempts++;
      
      try {
        const statusRes = await axios.get(
          `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
          { headers: OPENAI_HEADERS }
        );
        
        runStatus = statusRes.data.status;
        console.log(`Run status (attempt ${attempts}):`, runStatus);
        
        if (runStatus === 'failed') {
          const errorDetails = statusRes.data.last_error;
          throw new Error(`Assistant run failed: ${errorDetails?.message || 'Unknown error'}`);
        }
        
        if (runStatus === 'expired') {
          throw new Error('Assistant run expired');
        }
        
        if (runStatus === 'cancelled') {
          throw new Error('Assistant run was cancelled');
        }
        
        // Add small delay to avoid rate limiting
        if (runStatus === 'in_progress') {
          await sleep(500);
        }
        
        // If completed, add small delay to ensure message is fully processed
        if (runStatus === 'completed') {
          await sleep(500);
          break;
        }
        
      } catch (error) {
        if (error.response?.status === 429) {
          // Rate limited - wait longer
          console.log('Rate limited, waiting 2 seconds...');
          await sleep(2000);
          continue;
        }
        throw error;
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Assistant run timed out');
    }

    // 5. Get messages with proper error handling
    const messagesRes = await axios.get(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      { headers: OPENAI_HEADERS }
    );

    if (!messagesRes.data?.data || !Array.isArray(messagesRes.data.data)) {
      throw new Error('Invalid messages response structure');
    }

    const assistantMessage = messagesRes.data.data.find(msg => msg.role === 'assistant');
    
    if (!assistantMessage) {
      throw new Error('No assistant message found in response');
    }

    const content = assistantMessage.content?.[0]?.text?.value;
    
    if (!content) {
      throw new Error('Assistant message has no text content');
    }

    console.log('Assistant response received successfully');
    
    // Try to parse JSON response first
    try {
      const jsonResponse = JSON.parse(content);
      
      // Validate JSON structure and extract shortcuts
      if (jsonResponse && typeof jsonResponse === 'object') {
        const response = {
          answer: jsonResponse.answer || "I apologize, but I couldn't generate a proper response.",
          shortcuts: jsonResponse.shortcuts || [],
          source: 'openai_assistant_json'
        };
        
        // Clean the answer text
        response.answer = cleanResponse(response.answer);
        
        return response;
      }
    } catch (jsonError) {
      console.log('Response is not valid JSON, treating as plain text');
    }
    
    // Fallback to plain text response (existing logic)
    return cleanResponse(content);

  } catch (error) {
    console.error('Error getting OpenAI Assistant response:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Provide more specific error messages
    if (error.response?.status === 400) {
      return "I apologize, but there was an issue with the request format. Please try rephrasing your question.";
    } else if (error.response?.status === 401) {
      return "I apologize, but there's an authentication issue. Please contact support.";
    } else if (error.response?.status === 429) {
      return "I apologize, but the service is currently busy. Please try again in a moment.";
    } else if (error.response?.status >= 500) {
      return "I apologize, but the service is experiencing technical difficulties. Please try again later.";
    }
    
    return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again later.";
  }
}

// Log unanswered questions
async function logUnansweredQuestion(question, userId = null) {
  try {
    console.log(`Unanswered question logged: "${question}" from user ${userId || 'anonymous'}`);
  } catch (error) {
    console.error('Error logging unanswered question:', error.message || error);
  }
}

// Test function to verify cleanResponse works correctly
function testCleanResponse() {
  const testCases = [
    "To start a daily practice, try the 9Day Breathwork Challenge for Energy, Health & Vitality. Begin with foundational breathing techniques in the morning to increase energy and improve focus. Follow up with calming practices like Bhramari and Alternate Nostril Breathing in the evening. For a structured guidance, you might visit www.youtube.com/Theschoolofbreath to explore additional resources and videos【4:15†source】.",
    "**Bold text** and *italic text* with ## headers and - lists",
    "Some text with [brackets] and (parentheses) and †source",
    "Text with 4:15†source and other timestamps like 2:30",
    "Text with 【brackets】 and emojis 🌟🌼🙏😊✨💫"
  ];
  
  console.log('Testing cleanResponse function:');
  testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}:`);
    console.log('Before:', testCase);
    console.log('After:', cleanResponse(testCase));
  });
}

// Uncomment the line below to test the cleaning function
// testCleanResponse();

module.exports = {
  handleUserQuestion,
  getOpenAIResponse,
  logUnansweredQuestion,
  testCleanResponse
};