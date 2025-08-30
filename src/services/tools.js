// OUTSIDE of handleChat, define your tool properly

const { tool} = require('ai');
const { z } = require('zod');
const Course = require('../models/courses.model');

// Function to fetch available courses from MongoDB
const fetchAvailableCourses = async () => {
  try {
    const courses = await Course.find({})
      .select('id title description type courseTheme author sections accessTags')
      .lean();
    
    return courses.map(course => ({
      id: course._id.toString(),
      title: course.title,
      description: course.description,
      type: course.type,
      category: course.courseTheme,
      author: course.author?.name,
      isFree: !course.accessTags || course.accessTags.length === 0,
      shortDescription: course.description?.substring(0, 150) + '...'
    }));
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

const recommendCourseTool = tool({
  name: 'recommend-course',
  description: 'Suggests the best courses for the user based on their favorite music category and past progress.',
  parameters: z.object({
    favoriteCategory: z.string().describe('User\'s favorite category, like Jazz or Classical'),
    completedCourses: z.array(z.string()).describe('Completed course IDs'),
    subscriptionLevel: z.enum(['free', 'premium']).describe('User\'s subscription level')
  }),
  execute: async ({ favoriteCategory, completedCourses, subscriptionLevel }) => {
    const allCourses = await fetchAvailableCourses(); // <-- You need to create this function

    const recommended = allCourses
      .filter(course =>
        course.category === favoriteCategory &&
        !completedCourses.includes(course.id) &&
        (subscriptionLevel === 'premium' || course.isFree)
      )
      .slice(0, 3);

    return {
      recommendedCourses: recommended.map(course => ({
        id: course.id,
        title: course.title,
        description: course.shortDescription,
      })),
    };
  },
});

module.exports = {
  recommendCourseTool
};
