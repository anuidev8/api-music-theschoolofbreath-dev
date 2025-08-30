# Guide Resources System - Flexible Resource Management

## Overview

The guide resources system has been updated to be completely flexible, allowing you to create any type of resource for your guides instead of being limited to just welcome, typing, and sent states.

## New Resource Schema

```javascript
{
  name: "welcome",           // Required: Unique resource identifier
  description: "Welcome animation", // Optional: Resource description
  image: "https://...",      // Required: URL to the resource
  type: "gif",               // Optional: Resource type (gif, image, video, audio, other)
  isActive: true,            // Optional: Whether resource is active
  order: 1                   // Optional: Display order
}
```

## API Endpoints

### Get All Resources for a Guide
```
GET /guides/:guideId/resources
```

### Get Specific Resource by Name
```
GET /guides/:guideId/resources/:resourceName
```

### Add New Resource
```
POST /guides/:guideId/resources
Body: {
  "name": "meditation",
  "description": "Meditation pose image",
  "image": "https://example.com/meditation.jpg",
  "type": "image",
  "order": 4
}
```

### Update Resource
```
PUT /guides/:guideId/resources/:resourceName
Body: {
  "description": "Updated description",
  "isActive": false
}
```

### Remove Resource
```
DELETE /guides/:guideId/resources/:resourceName
```

## Example Usage

### Adding a New Resource
```javascript
// Add a meditation resource to Abhi guide
const newResource = {
  name: "meditation",
  description: "Meditation pose guidance",
  image: "https://storage.googleapis.com/schoolbreathvideos/images/meditation_pose.jpg",
  type: "image",
  order: 4
};

const response = await fetch('/guides/abhi/resources', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newResource)
});
```

### Getting Resources
```javascript
// Get all resources for Abhi
const resources = await fetch('/guides/abhi/resources');
const data = await resources.json();

// Get specific resource
const welcomeResource = await fetch('/guides/abhi/resources/welcome');
const welcomeData = await welcomeResource.json();
```

## Resource Types

- **gif** - Animated GIF files
- **image** - Static images (JPG, PNG, etc.)
- **video** - Video files
- **audio** - Audio files
- **other** - Any other resource type

## Benefits of the New System

1. **Flexibility** - Create any resource type you want
2. **Scalability** - Add unlimited resources per guide
3. **Organization** - Use names and descriptions for better organization
4. **Ordering** - Control the display order of resources
5. **Activation** - Enable/disable resources without deleting them
6. **Type Safety** - Categorized resource types for better management

## Migration Notes

The old fixed structure (welcome, typing, sent) has been converted to the new flexible format. Existing functionality will continue to work, but now you can:

- Add new resources beyond the original three
- Modify resource properties easily
- Organize resources by type and order
- Manage resource lifecycle (active/inactive)

## Example Resource Ideas

- **Breathing exercises** - Step-by-step breathing guides
- **Meditation poses** - Different meditation positions
- **Mantras** - Audio or text mantras
- **Chakra images** - Visual representations
- **Progress tracking** - Achievement badges or milestones
- **Custom animations** - Personalized user interactions

This new system gives you complete freedom to create the guide experience your users need!
