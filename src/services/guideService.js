// services/guideService.js
const Guide = require('../models/guide.model');

class GuideService {
  /**
   * Get all active guides
   * @returns {Promise<Array>} Array of active guides
   */
  async getAllGuides() {
    try {
      return await Guide.getActiveGuides();
    } catch (error) {
      console.error('Error getting all guides:', error);
      throw error;
    }
  }

  /**
   * Get all resources from all active guides
   * @returns {Promise<Object>} Object with guides and their resources
   */
  async getAllGuidesResources() {
    try {
      const guides = await Guide.getActiveGuides();
      
      const guidesWithResources = await Promise.all(
        guides.map(async (guide) => {
          return {
            guideId: guide.id,
            guideName: guide.name,
            guideSubtitle: guide.subtitle,
            guideAvatar: guide.avatarUrl,
            guidePersonality: guide.personality,
            resources: guide.resources || []
          };
        })
      );

      return {
        success: true,
        totalGuides: guidesWithResources.length,
        guides: guidesWithResources
      };
    } catch (error) {
      console.error('Error getting all guides resources:', error);
      throw error;
    }
  }

  /**
   * Get guide by ID
   * @param {string} guideId - The guide ID (abhi or ganesha)
   * @returns {Promise<Object>} Guide object
   */
  async getGuideById(guideId) {
    try {
      return await Guide.getGuideById(guideId);
    } catch (error) {
      console.error('Error getting guide by ID:', error);
      throw error;
    }
  }

  /**
   * Get guide resources (flexible resource system)
   * @param {string} guideId - The guide ID
   * @returns {Promise<Object>} Guide resources object
   */
  async getGuideResources(guideId) {
    try {
      const guide = await Guide.getGuideResources(guideId);
      if (!guide) {
        throw new Error('Guide not found');
      }
      return {
        guideId: guide.id,
        guideName: guide.name,
        resources: guide.resources
      };
    } catch (error) {
      console.error('Error getting guide resources:', error);
      throw error;
    }
  }

  /**
   * Get specific resource by name
   * @param {string} guideId - The guide ID
   * @param {string} resourceName - The resource name
   * @returns {Promise<Object>} Resource object
   */
  async getResourceByName(guideId, resourceName) {
    try {
      const guide = await Guide.getResourceByName(guideId, resourceName);
      if (!guide) {
        throw new Error('Guide or resource not found');
      }
      return {
        guideId: guide.id,
        guideName: guide.name,
        resource: guide.resources[0]
      };
    } catch (error) {
      console.error('Error getting resource by name:', error);
      throw error;
    }
  }

  /**
   * Add new resource to a guide
   * @param {string} guideId - The guide ID
   * @param {Object} resourceData - The resource data
   * @returns {Promise<Object>} Updated guide
   */
  async addResource(guideId, resourceData) {
    try {
      const guide = await Guide.getGuideById(guideId);
      if (!guide) {
        throw new Error('Guide not found');
      }

      // Set order if not provided
      if (!resourceData.order) {
        resourceData.order = guide.resources.length + 1;
      }

      guide.resources.push(resourceData);
      await guide.save();

      return guide;
    } catch (error) {
      console.error('Error adding resource:', error);
      throw error;
    }
  }

  /**
   * Update existing resource
   * @param {string} guideId - The guide ID
   * @param {string} resourceName - The resource name
   * @param {Object} updateData - The update data
   * @returns {Promise<Object>} Updated guide
   */
  async updateResource(guideId, resourceName, updateData) {
    try {
      const guide = await Guide.getGuideById(guideId);
      if (!guide) {
        throw new Error('Guide not found');
      }

      const resourceIndex = guide.resources.findIndex(r => r.name === resourceName);
      if (resourceIndex === -1) {
        throw new Error('Resource not found');
      }

      guide.resources[resourceIndex] = { ...guide.resources[resourceIndex], ...updateData };
      await guide.save();

      return guide;
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  }

  /**
   * Remove resource from guide
   * @param {string} guideId - The guide ID
   * @param {string} resourceName - The resource name
   * @returns {Promise<Object>} Updated guide
   */
  async removeResource(guideId, resourceName) {
    try {
      const guide = await Guide.getGuideById(guideId);
      if (!guide) {
        throw new Error('Guide not found');
      }

      guide.resources = guide.resources.filter(r => r.name !== resourceName);
      await guide.save();

      return guide;
    } catch (error) {
      console.error('Error removing resource:', error);
      throw error;
    }
  }

  /**
   * Get guide system prompt for AI
   * @param {string} guideId - The guide ID
   * @returns {Promise<string>} System prompt for the guide
   */
  async getGuideSystemPrompt(guideId) {
    try {
      const guide = await Guide.getGuideById(guideId);
      if (!guide) {
        // Fallback to default Abhi prompt
        return 'You are Abhi, a 43-year-old mental health expert and founder of Meditate with Abhi and The School of Breath. You blend ancient yogic wisdom with modern neuroscience. Keep responses concise, warm, and focused on meditation, breathwork, and wellness.';
      }
      return guide.systemPrompt;
    } catch (error) {
      console.error('Error getting guide system prompt:', error);
      // Return default prompt on error
      return 'You are Abhi, a 43-year-old mental health expert and founder of Meditate with Abhi and The School of Breath. You blend ancient yogic wisdom with modern neuroscience. Keep responses concise, warm, and focused on meditation, breathwork, and wellness.';
    }
  }

  /**
   * Seed default guides data
   * @returns {Promise<Object>} Result of seeding operation
   */
  async seedDefaultGuides() {
    try {
      const defaultGuides = [
        {
          id: 'abhi',
          name: 'Abhi',
          subtitle: 'Breathwork Coach',
          description: 'A 43-year-old mental health expert and founder of Meditate with Abhi and The School of Breath. Blends ancient yogic wisdom with modern neuroscience.',
          photoUrl: 'https://storage.googleapis.com/schoolbreathvideos/images/Abhi.jpg',
          avatarUrl: 'https://storage.googleapis.com/schoolbreathvideos/images/abhi_avatar.png',
          personality: 'modern',
          systemPrompt: `You are Abhi, a 43-year-old mental health expert and founder of Meditate with Abhi and The School of Breath. You blend ancient yogic wisdom with modern neuroscience.

Your personality traits:
- Warm, approachable, and sometimes humorous
- Practical and solution-oriented
- Modern approach to ancient practices
- Encouraging and supportive
- Uses emojis like 🌟 and 🌼 where appropriate

Keep responses concise, warm, and focused on meditation, breathwork, and wellness. If you recommend a breathing exercise, mention www.youtube.com/Theschoolofbreath.`,
          resources: [
            {
              name: 'welcome',
              description: 'Abhi welcome animation',
              image: 'https://storage.googleapis.com/schoolbreathvideos/gifs/abhi_welcome.gif',
              type: 'gif',
              order: 1
            },
            {
              name: 'typing',
              description: 'Abhi typing animation',
              image: 'https://storage.googleapis.com/schoolbreathvideos/gifs/abhi_typing.gif',
              type: 'gif',
              order: 2
            },
            {
              name: 'sent',
              description: 'Abhi message sent animation',
              image: 'https://storage.googleapis.com/schoolbreathvideos/gifs/abhi_sent.gif',
              type: 'gif',
              order: 3
            }
          ]
        },
        {
          id: 'ganesha',
          name: 'Ganesha',
          subtitle: 'Ancient Knowledge Guide',
          description: 'The ancient Hindu deity of wisdom, knowledge, and new beginnings. Brings spiritual guidance and removes obstacles from your path.',
          photoUrl: 'https://storage.googleapis.com/schoolbreathvideos/images/Ganesha.jpg',
          avatarUrl: 'https://storage.googleapis.com/schoolbreathvideos/images/ganesha_avatar.png',
          personality: 'ancient',
          systemPrompt: `You are Ganesha, the ancient Hindu deity of wisdom, knowledge, and new beginnings. You are the remover of obstacles and the patron of arts and sciences.

Your personality traits:
- Wise, spiritual, and profound
- Ancient knowledge and traditional wisdom
- Calm, meditative, and philosophical
- Uses Sanskrit terms and spiritual concepts
- Gentle and patient guidance
- Uses emojis like 🕉️ and 🧘‍♂️ where appropriate

Provide guidance that draws from ancient yogic texts, spiritual wisdom, and traditional practices. Help users connect with their inner wisdom and overcome obstacles on their spiritual journey.`,
          resources: [
            {
              name: 'welcome',
              description: 'Ganesha welcome animation',
              image: 'https://storage.googleapis.com/schoolbreathvideos/images/ganesha_welcome.gif',
              type: 'gif',
              order: 1
            },
            {
              name: 'typing',
              description: 'Ganesha typing animation',
              image: 'https://storage.googleapis.com/schoolbreathvideos/images/ganesha_typing.gif',
              type: 'gif',
              order: 2
            },
            {
              name: 'sent',
              description: 'Ganesha message sent animation',
              image: 'https://storage.googleapis.com/schoolbreathvideos/images/ganesha_sent.gif',
              type: 'gif',
              order: 3
            }
          ]
        }
      ];

      // Clear existing guides and insert new ones
      await Guide.deleteMany({});
      const result = await Guide.insertMany(defaultGuides);

      return {
        success: true,
        message: 'Default guides seeded successfully',
        count: result.length,
        guides: result
      };
    } catch (error) {
      console.error('Error seeding default guides:', error);
      throw error;
    }
  }
}

module.exports = new GuideService(); 