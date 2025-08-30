const controller = require("../controllers/courses.controller");
const CoursesController = require("../controllers/upload_courses.controller");
const couseProgressController = require("../controllers/course_progress.controller");
const couseProgressControllerUser = require("../controllers/course_progress_user.controller");
const { Router } = require("express");
const { authorize } = require("../utils/auth");

let router = Router();

// old
//router.route("/user").get(controller.getCourses);

// new one
router.route("/user").get(couseProgressControllerUser.getCourses);
router.get("/course/:courseId/sections", couseProgressControllerUser.getCourseSectionsAndLessons);

router.route("/usersystemeio").get(CoursesController.getSystemeIoCourses);
router.route("/create").post(CoursesController.createCourse);
router.route("/update").put(CoursesController.updateCourse);
/* router.route("/list").get(  CoursesController.getCourses); */
router.route("/course/:id").get(CoursesController.getCourseById);
router.route("/scratch").get(CoursesController.getScratchCourses);

router.route("/scratch/:id").delete(CoursesController.deleteScratchCourse);
router.route("/delete/:id").delete(CoursesController.deleteCourse);
router.put("/order", CoursesController.updateCourseOrder);

//GET

router.post(
  "/:courseId/sections/:sectionId/lessons/:lessonId/complete",
  authorize(),
  couseProgressController.markLessonAsCompleted
);

router.patch(
  "/:courseId/sections/:sectionId/lessons/:lessonId/progress",
  authorize(),
  couseProgressController.updateLessonProgress
);
router.get(
  "/:courseId/sections/:sectionId/lessons/:lessonId/progress",
  authorize(),
  couseProgressControllerUser.getLessonProgress
);

router.get("/my-progress",authorize(), couseProgressController.getCourseStatistics);

// router.get("/:courseId", couseProgressController.getCourseProgress);




module.exports = router;
