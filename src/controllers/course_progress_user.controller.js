

const CourseProgress = require('../models/userProgress.model');
const axios = require("axios");

const Course = require("../models/courses.model");

const fullAccessTags = ["Enrolled_Holistic Membership"];



const User = require("../models/user.model");
const limitedAccessRules = {
    Enrolled_to_Sleep_Membership: ["7"],
    "Purchased_9-Day Breathwork Course": ["4"],
    "Purchased_9-Day Meditation Course": ["5"],
    Purchased_Swara_Yoga_Course: ["6"],
    "Purchased_9-Day Bliss Course": ["1"],
    "Purchased_12-Day ThirdEye Course": ["8"],
  };
  
  const combinedAccessRules = [
    {
      tags: ["Enrolled_to_Sleep_Membership", "Purchased_9-Day Breathwork Course"],
      courses: ["4", "7"],
    },
    {
      tags: [
        "Purchased_9-Day Breathwork Course",
        "Purchased_9-Day Meditation Course",
      ],
      courses: ["4", "5"],
    },
  ];
  
  const getAccessibleCourses = (userTags) => {
    if (userTags.length === 0) {
      return [];
    }
  
    let accessible = new Set();
  
    if (userTags.some((tag) => fullAccessTags.includes(tag))) {
      return "full";
    }
  
    userTags.forEach((tag) => {
      if (limitedAccessRules[tag]) {
        limitedAccessRules[tag].forEach((courseId) => accessible.add(courseId));
      }
    });
  
    combinedAccessRules.forEach((rule) => {
      if (rule.tags.every((tag) => userTags.includes(tag))) {
        rule.courses.forEach((courseId) => accessible.add(courseId));
      }
    });
  
    return Array.from(accessible);
  };
exports.getLessonProgress = async (req, res) => {
    try {
        const { courseId, sectionId, lessonId } = req.params;
        const userId = req.user._id;

        // Find progress record
        const progress = await CourseProgress.findOne({ courseId, userId });

        if (!progress) {
            return res.status(200).json({
                status: "success",
                data: {
                    watchTimeInSeconds: 0,
                    completed: false,
                    lastWatched: null
                }
            });
        }

        // Find specific lesson progress
        const sectionProgress = progress.sectionsProgress.find(
            section => section.sectionId.toString() === sectionId
        );

        const lessonProgress = sectionProgress?.lessonsProgress.find(
            lesson => lesson.lessonId.toString() === lessonId
        );

        if (!lessonProgress) {
            return res.status(200).json({
                status: "success",
                data: {
                    watchTimeInSeconds: 0,
                    completed: false,
                    lastWatched: null
                }
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                watchTimeInSeconds: lessonProgress.watchTimeInSeconds,
                completed: lessonProgress.completed,
                lastWatched: lessonProgress.lastWatched,
                status: lessonProgress.status
            }
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

exports.getCourseSectionsAndLessons = async (req, res) => {
    try {
      const { courseId } = req.params;
      const userEmail = req.query.email;
  
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      if (!userEmail) {
        const sectionsWithLimitedAccess = course.sections
          .map((section) => {
            const sectionData = section.toObject();
            if (section.isPremium) {
              sectionData.lessons = section.lessons.filter(
                (lesson) => !lesson.isPremium
              );
            }
            sectionData.lessons.forEach(lesson => lesson.completed = false);
            sectionData.isCompleted = false;
            return sectionData;
          })
          .filter((section) => section.lessons.length > 0);
  
        return res.status(200).json({
          sections: sectionsWithLimitedAccess,
          hasAccess: false
        });
      }
  
      // Get user tags from Systeme.io
      const response = await axios.get(
        `https://api.systeme.io/api/contacts?email=${userEmail}`,
        {
          headers: {
            "x-api-key": process.env.API_SYSTEME_KEY,
          },
        }
      );
  
      const contacts = response.data?.items[0] ?? null;
      const userTags = contacts ? contacts.tags.map((tag) => tag.name) : [];
  
      const hasFullAccess = userTags.some((tag) => fullAccessTags.includes(tag));
      const hasSpecificAccess = course.accessTags.some((tag) => userTags.includes(tag));
  
      // Get user progress
      const user = await User.findOne({ email: userEmail });
      const progressData = user ? 
        await CourseProgress.findOne({ userId: user._id, courseId: course._id }) : null;
  
      const sectionsWithProgress = course.sections.map((section) => {
        const sectionData = section.toObject();
        let allLessonsCompleted = true;
  
        sectionData.lessons.forEach((lesson) => {
          if (progressData) {
            const sectionProgress = progressData.sectionsProgress.find(
              sp => sp.sectionId.toString() === section._id.toString()
            );
            if (sectionProgress) {
              const lessonProgress = sectionProgress.lessonsProgress.find(
                lp => lp.lessonId.toString() === lesson._id.toString()
              );
              lesson.completed = lessonProgress ? lessonProgress.completed : false;
              if (!lesson.completed) {
                allLessonsCompleted = false;
              }
            } else {
              lesson.completed = false;
              allLessonsCompleted = false;
            }
          } else {
            lesson.completed = false;
            allLessonsCompleted = false;
          }
        });
  
        sectionData.isCompleted = allLessonsCompleted;
        return sectionData;
      });
  
      if (!hasFullAccess && !hasSpecificAccess) {
        // Filter premium content for users without access
        const filteredSections = sectionsWithProgress
          .map((section) => {
            if (section.isPremium) {
              section.lessons = section.lessons.filter(
                (lesson) => !lesson.isPremium
              );
            }
            return section;
          })
          .filter((section) => section.lessons.length > 0);
  
        return res.status(200).json({
          sections: filteredSections,
          hasAccess: false
        });
      }
  
      return res.status(200).json({
        sections: sectionsWithProgress,
        hasAccess: true
      });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.getCourses = async (req, res) => {
    try {
      const userEmail = req.query.email;
      //const courses = await Course.find().select('-sections').sort({ order: 1, createdAt: -1 });
      const courses = await Course.find().sort({ order: 1, createdAt: -1 });
      if (!userEmail) {
        const coursesWithLimitedAccess = courses.map((course) => {
          const processedCourse = course.toObject();
          processedCourse.sections = [];
          return {
            ...processedCourse,
            hasAccess: false,
            progress: 0,
          };
        });
  
        return res.status(200).json({
          courses: coursesWithLimitedAccess,
        });
      }
  
      const response = await axios.get(
        `https://api.systeme.io/api/contacts?email=${userEmail}`,
        {
          headers: {
            "x-api-key": process.env.API_SYSTEME_KEY,
          },
        }
      );
  
      const contacts = response.data?.items[0] ?? null;
      const userTags = contacts ? contacts.tags.map((tag) => tag.name) : [];
  
      const user = await User.findOne({ email: userEmail });
      const userProgresses = user ? await CourseProgress.find({ userId: user._id }) : [];
  
      const progressMap = userProgresses.reduce((acc, progress) => {
        acc[progress.courseId] = progress;
        return acc;
      }, {});
  
      const coursesWithAccess = courses.map((course) => {
        const hasFullAccess = userTags.some((tag) =>
          fullAccessTags.includes(tag)
        );
        const hasSpecificAccess = course.accessTags.some((tag) =>
          userTags.includes(tag)
        );
        const courseObj = course.toObject();
        courseObj.sections = [];
        const progressData = progressMap[course._id];
        const completionPercentage = progressData ? progressData.completionPercentage : 0;
  
        return {
          ...courseObj,
          hasAccess: hasFullAccess || hasSpecificAccess,
          progress: completionPercentage,
        };
      });
  
      return res.status(200).json({ courses: coursesWithAccess });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };