const controller = require("../controllers/music.app.controller");
const { Router } = require("express");
const { authorize } = require("../utils/auth");
const meditationGuideController = require("../controllers/music.app.mantra.controller");

let router = Router();

router.route("/favorites").get(authorize(), controller.getAllFavoritesByCategory);
router.route("/preview").get( controller.getPreviewMusicsByCategory);
router.route("/category").get(authorize(),controller.getMusicsByCategory);
router.route("/shakra").get(controller.getShakraMusicByCategory);

//guided meditation
router.route("/guided-meditation").get(meditationGuideController.getGuidedMeditationMusicByCategory);



module.exports = router;
