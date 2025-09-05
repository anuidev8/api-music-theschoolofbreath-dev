// utils/qaHandler.js - OpenAI Assistant implementation
const axios = require('axios');
const guideService = require('../services/guideService');
const ChatHistory = require('../models/chat.model');

// OpenAI Assistant configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = 'asst_MeHsxxAOO77rSU2KKA2vCXqF';
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID; // for file_search
const OPENAI_HEADERS = {
  'Authorization': `Bearer ${OPENAI_API_KEY}`,
  'Content-Type': 'application/json',
  'OpenAI-Beta': 'assistants=v2'
};

// Delay helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Clean response function to remove markdown and formatting
// Clean response function (narrow removals, keep [] and ())
function cleanResponse(answer) {
  return String(answer || '')
    .replace(/【[^】]*】/g, '')        // Remove in-house citations
    .replace(/\b\d+:\d+†source\b/g, '')
    .replace(/†source\b/g, '')
    .replace(/[🌟🌼🙏😊✨💫]/g, '')    // Remove emojis
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// RAG: Main handler with PRE-GENERATED embeddings (super fast!)
async function handleUserQuestion(query, selectedGuide = 'abhi', sessionId = null) {
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
    const assistantResponse = await getOpenAIResponse(query, selectedGuide, sessionId);
    
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
async function getOpenAIResponse(query, selectedGuide = 'abhi', sessionId = null) {
  if (!OPENAI_API_KEY || !ASSISTANT_ID) {
    console.error('OpenAI API key or Assistant ID not found');
    return "I apologize, but I'm having trouble accessing my knowledge base right now. Please try again later.";
  }

  try {
    const guideContext = await guideService.getGuideSystemPrompt(selectedGuide);

    // Try to reuse a thread per chat session; otherwise create and persist
    let threadId = null;
    if (sessionId) {
      try {
        const chatHistory = await ChatHistory.findOne({ sessionId });
        threadId = chatHistory?.metadata?.openAIThreadId || null;
      } catch (e) {
        console.warn('Unable to load session for thread reuse:', e?.message || e);
      }
    }
    if (!threadId) {
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
      threadId = threadRes.data.id;
      console.log('Thread created:', threadId);
      if (sessionId) {
        try {
          const chatHistory = await ChatHistory.findOne({ sessionId });
          if (chatHistory) {
            chatHistory.metadata = {
              ...(chatHistory.metadata || {}),
              openAIThreadId: threadId,
              selectedGuide: selectedGuide,
              lastActive: new Date()
            };
            await chatHistory.save();
          }
        } catch (persistErr) {
          console.error('Failed to persist thread ID to session:', persistErr?.message || persistErr);
        }
      }
    }

    // 2. Add user message with proper content structure
    let messageRes;
    try {
      messageRes = await axios.post(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          role: 'user',
          content: `Context: ${guideContext}\n\nUser Question: ${query}`
        },
        { headers: OPENAI_HEADERS }
      );
    } catch (err) {
      if (err?.response?.status === 404) {
        // Thread invalid; recreate and persist once then retry
        const newThreadRes = await axios.post('https://api.openai.com/v1/threads', {
          metadata: {
            source: 'breathwork_app',
            guide: selectedGuide,
            timestamp: new Date().toISOString()
          }
        }, { headers: OPENAI_HEADERS });
        if (!newThreadRes.data?.id) {
          throw new Error('Failed to recreate thread: No thread ID returned');
        }
        threadId = newThreadRes.data.id;
        if (sessionId) {
          try {
            const chatHistory = await ChatHistory.findOne({ sessionId });
            if (chatHistory) {
              chatHistory.metadata = {
                ...(chatHistory.metadata || {}),
                openAIThreadId: threadId,
                selectedGuide: selectedGuide,
                lastActive: new Date()
              };
              await chatHistory.save();
            }
          } catch (persistErr) {
            console.error('Failed to persist recreated thread ID to session:', persistErr?.message || persistErr);
          }
        }
        messageRes = await axios.post(
          `https://api.openai.com/v1/threads/${threadId}/messages`,
          {
            role: 'user',
            content: `Context: ${guideContext}\n\nUser Question: ${query}`
          },
          { headers: OPENAI_HEADERS }
        );
      } else {
        throw err;
      }
    }
    
    if (!messageRes.data?.id) {
      throw new Error('Failed to add message: No message ID returned');
    }
    
    console.log('Message added:', messageRes.data.id);

    // 3. Run the assistant
    const runRes = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      { 
        assistant_id: ASSISTANT_ID,
        model: "gpt-4.1-mini",
        tools: [{ type: "file_search" }],
        ...(VECTOR_STORE_ID ? { tool_resources: { file_search: { vector_store_ids: [VECTOR_STORE_ID] } } } : {}),
        
        instructions:`${guideContext}

INSTRUCTIONS:
ROLE
• Act as the selected guide (“${selectedGuide}”) for The School of Breath.

SOURCES
• Use ONLY the provided knowledge base: FAQs format and files via file_search.
• Do NOT invent facts. If information is missing, return empty fields.

OUTPUT
• Return VALID JSON ONLY. No prose outside JSON. No code fences. No emojis.
• Keys exactly: answer, shortcuts.

MATCHING FLOW
1) Try to match the user query to the best FAQ.
2) You can also consult the uploaded documents via file_search for supporting information.
3) If nothing relevant is found, is nothing matched produce empty fields per schema.

CONTENT RULES
• “answer”: Markdown format for  paragraphs, headings,bold words and lists.
• Append at the very end of “answer”: " www.youtube.com/Theschoolofbreath www.meditatewithabhi.com"
• “shortcuts”: up to 4 related questions  and knowledge base.

MARKDOWN RULES (CommonMark/GitHub basics)
• Paragraphs: separate blocks with a single blank line; avoid trailing spaces.
• Headings: "# ", "## ", "### " when helpful; prefer plain paragraphs unless sectioning is requested.
• Emphasis: **bold** (or __bold__), *italic* (or _italic_). Use sparingly.
• Bulleted lists: each item starts with "- " (or "* "); add a blank line before the list; one item per line.
• Ordered lists: "1. ", "2. ", … with exactly one space after the marker.
• Nested lists: indent sub-items by 2–4 spaces under the parent item.
• Links: don't use links.
• Code blocks: avoid unless explicitly requested; don’t include fenced code in normal answers.
• Tables/images/footnotes: avoid unless the user asks.
• Do not use raw HTML; do not use emojis.

SCHEMA (MUST MATCH EXACTLY)
{ "answer": "<Markdown string>",  "shortcuts": ["string"] }

EMPTY CASE
{ "answer": "", "shortcuts": [] }

VALIDATION
• If your draft is not valid JSON per the schema, regenerate until it is valid.`
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
      
      // Validate JSON structure and extract shortcuts, bullets and steps
      if (jsonResponse && typeof jsonResponse === 'object') {
        const baseAnswer = jsonResponse.answer || "I apologize, but I couldn't generate a proper response.";
        const bullets = Array.isArray(jsonResponse.bullets) ? jsonResponse.bullets.filter(Boolean) : [];
        const steps = Array.isArray(jsonResponse.steps) ? jsonResponse.steps.filter(Boolean) : [];

        let composed = baseAnswer;
        if (steps.length > 0) {
          const numbered = steps.map((s, i) => `${i + 1}) ${s}`).join('\n');
          composed += `\n\n${numbered}`;
        }
        if (bullets.length > 0) {
          const dotted = bullets.map((b) => `• ${b}`).join('\n');
          composed += `\n\n${dotted}`;
        }

        const response = {
          answer: cleanResponse(composed),
          shortcuts: jsonResponse.shortcuts || [],
          source: 'openai_assistant_json'
        };
        
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
  // Core RAG functions
  handleUserQuestion,
  getOpenAIResponse,
  logUnansweredQuestion,
  testCleanResponse
};