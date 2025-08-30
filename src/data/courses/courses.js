// Import course data
const { BREATH_WORK_COURSE } = require('./breathWork');
const { BLISS_COURSE } = require('./blissCourse');
const { SLEEP_COURSE } = require('./sleep');
const { MEDITATION_COURSE} = require('./meditation')
const { SWARA_COURSE} = require('./swara')
const { THIRDEYE_COURSE } = require('./ThirdEyeCourse')

// Get all courses - now using arrays instead of database query
exports.getAllCourses = () => {
  return [
    BREATH_WORK_COURSE,  // id: "4"
    BLISS_COURSE,       // id: "1"
    SLEEP_COURSE,
    MEDITATION_COURSE,
    SWARA_COURSE,
    THIRDEYE_COURSE,
    

           
  ];
};