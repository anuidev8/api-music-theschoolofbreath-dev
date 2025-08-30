# Chat System Features - Complete Documentation

## 🚀 Overview

The School of Breath API includes a comprehensive chat system that provides intelligent conversational AI with multiple personalities, FAQ integration, session management, and analytics. The system is built with Node.js, Express, MongoDB, and integrates with OpenAI's Assistant API.

## 🏗️ Architecture

### Core Components
- **Chat Service** (`src/services/chatService.js`) - Main business logic
- **Chat Controller** (`src/controllers/chat/chat.controller.js`) - API endpoints
- **Chat Model** (`src/models/chat.model.js`) - Data persistence
- **QA Handler** (`src/utils/qaHandler.js`) - OpenAI integration
- **Guide Service** (`src/services/guideService.js`) - AI personality management
- **FAQ System** - Knowledge base integration

## 💬 Core Chat Features

### 1. Message Processing
- **Real-time Processing**: Instant message handling with async processing
- **Session Management**: Automatic session creation and management
- **User Identification**: Support for both user ID and email identification
- **Metadata Tracking**: Platform, device type, and user agent tracking

### 2. AI Personalities (Guides)
The system supports multiple AI personalities with distinct characteristics:

#### Abhi - Breathwork Coach
- **Personality**: Modern, approachable, practical
- **Expertise**: Mental health, meditation, breathwork
- **Style**: Warm, encouraging, solution-oriented
- **Resources**: Welcome animations, typing indicators, message sent animations

#### Ganesha - Ancient Knowledge Guide
- **Personality**: Wise, spiritual, profound
- **Expertise**: Ancient yogic wisdom, spiritual guidance
- **Style**: Calm, philosophical, traditional
- **Resources**: Spiritual-themed animations and resources

### 3. OpenAI Integration
- **Assistant API**: Uses OpenAI's latest Assistant API (v2)
- **Context-Aware**: Integrates guide personality into responses
- **JSON Responses**: Structured responses with answer and related shortcuts
- **Response Cleaning**: Automatic removal of markdown, citations, and formatting
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Rate Limiting**: Built-in rate limiting protection

#### JSON Response Structure
The system now returns structured JSON responses with:
```json
{
  "answer": "Clear, concise response to user's question",
  "shortcuts": [
    "Related question 1",
    "Related question 2",
    "Related question 3"
  ]
}
```

## 🔍 FAQ System Integration

### FAQ Categories
- **General**: Basic information about The School of Breath
- **Membership**: Subscription and access questions
- **Course**: Course-related inquiries
- **App**: Application functionality questions
- **Technical**: Technical support and troubleshooting

### FAQ Features
- **Topic-based Retrieval**: Get FAQs by category
- **Dynamic Seeding**: API endpoint to seed FAQ data
- **View Tracking**: Monitor most viewed questions
- **Category Analytics**: Statistical breakdown by category

## 📊 Session Management

### Session Features
- **Unique Session IDs**: UUID-based session identification
- **Persistent Storage**: MongoDB-based session persistence
- **Auto-expiration**: TTL index for automatic cleanup (180 days)
- **Multi-session Support**: Users can have multiple active sessions
- **Session Analytics**: Track session duration and activity

### Message History
- **Complete Conversation**: Store full conversation history
- **Message Metadata**: Track message source, timing, and formatting
- **Audio Support**: Flag messages that have audio versions
- **Background Colors**: Customizable message styling

## 🎯 Advanced Features

### 1. Smart Shortcuts & Follow-up Questions
- **AI-Generated Shortcuts**: Automatic generation of related questions
- **Contextual Suggestions**: Shortcuts based on conversation context
- **FAQ Integration**: Leverages existing FAQ relationships
- **User Experience**: Seamless conversation flow with suggested questions
- **Dynamic Content**: Shortcuts adapt to user's current query

### 2. Response Formatting
- **Clean Responses**: Automatic removal of unwanted formatting
- **Markdown Removal**: Strip **bold**, *italic*, headers, lists
- **Citation Cleaning**: Remove source references, timestamps
- **Emoji Filtering**: Clean up special characters and emojis
- **Whitespace Normalization**: Consistent spacing and formatting

### 2. Analytics & Insights
- **Top Questions**: Most frequently asked questions
- **Guide Analytics**: Usage statistics per AI personality
- **User Statistics**: Session count, message count, averages
- **FAQ Analytics**: Category breakdowns and popular content
- **Performance Metrics**: Response times and success rates

### 3. User Experience Features
- **Background Colors**: Dynamic message styling
- **Audio Integration**: Support for audio message responses
- **Platform Detection**: Automatic device and platform recognition
- **Progressive Enhancement**: Graceful degradation for different clients
- **Smart Shortcuts**: AI-generated related question suggestions
- **Conversation Flow**: Seamless follow-up question recommendations

## 🔌 API Endpoints

### Chat Operations
```
POST /chat                    - Process user message
GET  /chat/history/:sessionId - Get conversation history
GET  /chat/sessions          - Get user sessions
GET  /chat/session/:sessionId/guide - Get session guide info
GET  /chat/analytics        - Get chat analytics
```

### FAQ Operations
```
GET  /chat/topics           - Get available topics
GET  /chat/faq/:category   - Get FAQs by category
POST /chat/seed-faqs       - Seed FAQ data
POST /chat/listen-question - Track question engagement
```

## 🗄️ Data Models

### Chat History Schema
```javascript
{
  userId: String,           // User identifier
  sessionId: String,        // Unique session ID
  messages: [Message],      // Array of messages
  metadata: {
    userAgent: String,      // Browser/device info
    platform: String,       // Platform type
    deviceType: String,     // Device category
    selectedGuide: String,  // AI personality
    lastActive: Date        // Last activity timestamp
  },
  createdAt: Date,          // Creation timestamp
  updatedAt: Date           // Last update timestamp
}
```

### Message Schema
```javascript
{
  text: String,             // Message content
  isUser: Boolean,          // User vs AI message
  hasAudio: Boolean,        // Audio availability
  backgroundColor: String,   // Message styling
  source: String,           // Message source
  shortcuts: [String],      // Related question suggestions
  createdAt: Date           // Message timestamp
}
```

### FAQ Schema
```javascript
{
  category: String,         // FAQ category
  question: String,         // FAQ question
  answer: String,           // FAQ answer
  backgroundColor: String,   // Styling color
  createdAt: Date,          // Creation timestamp
  updatedAt: Date           // Update timestamp
}
```

## 🚀 Setup & Configuration

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key
ASSISTANT_ID=your_openai_assistant_id
MONGODB_URI=your_mongodb_connection_string
```

### Database Indexes
- **User Index**: Fast user-based queries
- **Session Index**: Efficient session retrieval
- **Time Index**: Time-based queries and TTL
- **TTL Index**: Automatic document expiration

### Dependencies
```json
{
  "mongoose": "^6.0.0",
  "axios": "^1.0.0",
  "uuid": "^9.0.0",
  "express": "^4.0.0"
}
```

## 🔧 Development Features

### Testing & Debugging
- **Response Testing**: Built-in response cleaning test function
- **Error Logging**: Comprehensive error tracking and logging
- **Performance Monitoring**: Response time and success rate tracking
- **Debug Mode**: Detailed logging for development

### Code Quality
- **ES6+ Features**: Modern JavaScript with async/await
- **Error Handling**: Comprehensive try-catch blocks
- **Input Validation**: Request parameter validation
- **Type Safety**: Mongoose schema validation

## 📈 Performance & Scalability

### Optimization Features
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connection management
- **Async Processing**: Non-blocking message handling
- **Memory Management**: Automatic cleanup of old sessions

### Monitoring
- **Response Times**: Track API performance
- **Error Rates**: Monitor system health
- **Usage Patterns**: Understand user behavior
- **Resource Usage**: Database and memory monitoring

## 🔒 Security Features

### Data Protection
- **User Privacy**: Secure user data handling
- **Session Isolation**: Separate sessions per user
- **Input Sanitization**: Clean and validate user inputs
- **API Key Security**: Secure OpenAI API integration

### Access Control
- **User Authentication**: Support for authenticated users
- **Session Validation**: Secure session management
- **Rate Limiting**: Protection against abuse
- **Error Masking**: Safe error messages for users

## 🚀 Future Enhancements

### Planned Features
- **Multi-language Support**: Internationalization
- **Voice Integration**: Speech-to-text and text-to-speech
- **Advanced Analytics**: Machine learning insights
- **Real-time Updates**: WebSocket integration
- **Mobile Optimization**: Enhanced mobile experience

### Integration Opportunities
- **CRM Integration**: Customer relationship management
- **Learning Management**: Course progress tracking
- **Payment Systems**: Subscription management
- **Social Features**: Community and sharing

## 📚 Usage Examples

### Basic Chat Usage
```javascript
// Send a message
const response = await fetch('/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "How do I start meditation?",
    userId: "user123",
    selectedGuide: "abhi"
  })
});

// Response includes shortcuts for follow-up questions
console.log(response.shortcuts); // ["What breathing techniques do you recommend?", "How long should I meditate?", ...]

// Get conversation history
const history = await fetch('/chat/history/session123');
```

### FAQ Integration
```javascript
// Get FAQs by category
const faqs = await fetch('/chat/faq/general');

// Track question engagement
await fetch('/chat/listen-question', {
  method: 'POST',
  body: JSON.stringify({ faqId: "faq123" }),
  query: { userEmail: "user@example.com" }
});
```

## 🤝 Contributing

### Development Guidelines
- Follow existing code patterns
- Add comprehensive error handling
- Include proper documentation
- Test all new features
- Maintain backward compatibility

### Testing Strategy
- Unit tests for services
- Integration tests for API endpoints
- Performance testing for scalability
- Security testing for vulnerabilities

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: The School of Breath Development Team
