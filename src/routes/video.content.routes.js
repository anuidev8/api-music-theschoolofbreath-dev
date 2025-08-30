const { Router } = require("express");
const controller = require("../controllers/viedo.content.controller");


const router = Router();

//app
router.get("/videos", controller.getVideos);



// Public routes
router.get("/", controller.getAllVideoContent);
router.get("/:id", controller.getVideoContentById);

// Protected routes
router.post("/",  controller.createVideoContent);
router.put("/:videoId", controller.updateVideoContent);
router.delete("/:id", controller.deleteVideoContent);
router.put("/position/bulk", controller.updatePosition);
router.put("/favorite/:id", controller.toggleFavorite);




module.exports = router;