const { Router } = require("express");
const controller = require("../controllers/video.controller");
const multer = require('multer');
const { authorize} = require("../utils/auth");
let router = Router();
// Initialize multer for file handling
const uploadMulter = multer({storage: multer.memoryStorage()});
router.route("/all").get(controller.getAllAdmin) 
router.route("/add").post(controller.uploadFiles) 
router.route("/detail/:slug").get( controller.getOne);
router.route("/edit/:musicId").put(controller.editMusicItem) 
router.route("/delete/:musicId").delete(controller.deleteMusicItem) 
router.route("/category").get(controller.getMusicsByCategory);
router.route("/favorites/category").get(authorize(), controller.getAllFavoritesByCategory);

module.exports = router;
