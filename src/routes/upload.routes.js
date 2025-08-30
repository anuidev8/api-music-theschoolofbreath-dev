const { Router } = require("express");
const controller = require("../controllers/upload.controller");
const multer = require('multer');
let router = Router();
// Initialize multer for file handling
const uploadMulter = multer({storage: multer.memoryStorage()});

router.route("/add").post(uploadMulter.fields([{ name: 'audioFile' }, { name: 'imageFile' }]),controller.uploadFiles) 

router.route("/edit/:musicId").put(uploadMulter.fields([{ name: 'audioFile' }, { name: 'imageFile' }]),controller.editMusicItem) 
router.route("/delete/:musicId").delete(controller.deleteMusicItem) 

module.exports = router;
