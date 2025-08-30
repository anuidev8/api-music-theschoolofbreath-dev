# Guide Selection Functionality - API Implementation

## Overview

This implementation adds comprehensive guide selection functionality to the chat system, supporting multiple AI personalities with unique resources and responses.

## Features Implemented

### 1. Guide Management
- **Guide Model**: Stores guide information, personality, and resources
- **Guide Service**: Handles guide operations and data management
- **Guide Controller**: API endpoints for guide operations
- **Guide Routes**: RESTful API routes for guide functionality

### 2. Guide-Specific Resources
Each guide has unique GIF resources for different chat states:
- **Welcome GIF**: Initial greeting animation
- **Typing GIF**: Message composition animation  
- **Sent GIF**: Message delivery animation

### 3. Guide Personalities
- **Abhi**: Modern, practical approach with warm personality
- **Ganesha**: Ancient, spiritual wisdom with traditional guidance

### 4. Chat Integration
- Guide selection stored in chat session metadata
- Guide-specific AI responses using custom system prompts
- Guide analytics and tracking

## Database Schema

### Guide Model (`guide.model.js`)
```javascript
{
  id: 'abhi' | 'ganesha',
  name: 'Guide Name',
  subtitle: 'Guide Subtitle',
  description: 'Guide Description',
  photoUrl: 'Guide Photo URL',
  avatarUrl: 'Guide Avatar URL',
  personality: 'modern' | 'ancient' | 'spiritual' | 'practical',
  systemPrompt: 'AI System Prompt',
  resources: {
    welcome: { gifUrl: 'URL', description: 'Description' },
    typing: { gifUrl: 'URL', description: 'Description' },
    sent: { gifUrl: 'URL', description: 'Description' }
  },
  isActive: boolean
}
```

### Updated Chat Model (`chat.model.js`)
```javascript
metadata: {
  // ... existing fields
  selectedGuide: 'abhi' | 'ganesha',
  guidePersonality: 'modern' | 'ancient'
}
```

## API Endpoints

### Guide Endpoints (`/guides`)

#### GET `/guides`
- **Description**: Get all active guides
- **Response**: Array of guide objects

#### GET `/guides/:guideId`
- **Description**: Get specific guide by ID
- **Parameters**: `guideId` (abhi or ganesha)
- **Response**: Guide object

#### GET `/guides/:guideId/resources`
- **Description**: Get guide resources (GIFs)
- **Parameters**: `guideId` (abhi or ganesha)
- **Response**: Guide resources object

#### POST `/guides/select`
- **Description**: Select guide for a session
- **Body**: `{ guideId, sessionId, userEmail }`
- **Response**: Guide selection confirmation with resources

#### POST `/guides/seed`
- **Description**: Seed default guides (admin)
- **Response**: Seeding result

### Updated Chat Endpoints

#### POST `/chat`
- **Description**: Send message with guide support
- **Body**: `{ message, userId, userEmail, sessionId, selectedGuide }`
- **Response**: Chat response with selected guide info

#### GET `/chat/session/:sessionId/guide`
- **Description**: Get guide info for a session
- **Parameters**: `sessionId`
- **Response**: Session guide information and resources

## Guide Personalities

### Abhi (Modern)
- **Personality**: Warm, approachable, practical
- **Style**: Modern approach to ancient practices
- **Emojis**: 🌟 🌼
- **Focus**: Breathwork, meditation, wellness

### Ganesha (Ancient)
- **Personality**: Wise, spiritual, profound
- **Style**: Traditional wisdom and spiritual guidance
- **Emojis**: 🕉️ 🧘‍♂️
- **Focus**: Ancient texts, spiritual practices, obstacle removal

## Implementation Details

### 1. Guide Service (`guideService.js`)
- Guide CRUD operations
- Resource management
- System prompt generation
- Default data seeding

### 2. Updated Chat Service (`chatService.js`)
- Guide-aware message processing
- Session guide tracking
- Guide-specific analytics

### 3. Updated QA Handler (`qaHandler.js`)
- Guide-specific system prompts
- Personality-driven responses
- Fallback to default Abhi personality

### 4. Frontend Integration
The frontend can now:
- Fetch available guides
- Select guide for session
- Get guide-specific resources
- Display guide-specific GIFs
- Send messages with guide context

## Setup Instructions

### 1. Run Database Migration
```bash
# The guide model will be created automatically when first accessed
```

### 2. Seed Default Guides
```bash
# Option 1: Using the script
node seedGuides.js

# Option 2: Using the API endpoint
POST /guides/seed
```

### 3. Test Guide Functionality
```bash
# Get all guides
GET /guides

# Get specific guide
GET /guides/abhi

# Get guide resources
GET /guides/abhi/resources

# Select guide for session
POST /guides/select
{
  "guideId": "abhi",
  "sessionId": "session-123",
  "userEmail": "user@example.com"
}

# Send message with guide
POST /chat
{
  "message": "Hello",
  "userEmail": "user@example.com",
  "sessionId": "session-123",
  "selectedGuide": "abhi"
}
```

## Frontend Integration Example

### CharacterSelection Component
```typescript
// Fetch guides from API
const guides = await fetch('/guides').then(r => r.json());

// Select guide
const guideSelection = await fetch('/guides/select', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    guideId: 'abhi',
    sessionId: currentSessionId,
    userEmail: userEmail
  })
}).then(r => r.json());

// Use guide resources
const { resources } = guideSelection;
// resources.welcome.gifUrl
// resources.typing.gifUrl
// resources.sent.gifUrl
```

### ChatbotWindow Component
```typescript
// Send message with guide context
const response = await fetch('/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userMessage,
    userEmail: userEmail,
    sessionId: sessionId,
    selectedGuide: selectedGuide
  })
}).then(r => r.json());
```

## Analytics

The system now tracks:
- Guide selection analytics
- Guide usage statistics
- Guide-specific message counts
- User guide preferences

## Error Handling

- Graceful fallback to Abhi personality if guide not found
- Default system prompts for error cases
- Validation for guide IDs and session data
- Proper error responses for invalid requests

## Future Enhancements

1. **Additional Guides**: Add more personality types
2. **Custom Resources**: Allow custom GIF uploads
3. **Guide Preferences**: User-specific guide preferences
4. **Guide Switching**: Mid-conversation guide changes
5. **Guide Analytics**: Detailed usage analytics
6. **Guide Customization**: Admin guide management interface

## Notes

- All GIF URLs are placeholders and need to be updated with actual URLs
- Guide system prompts can be customized for different personalities
- The implementation maintains backward compatibility
- Guide selection is session-based and persists throughout the conversation 