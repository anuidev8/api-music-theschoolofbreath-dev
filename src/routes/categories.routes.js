const controller = require("../controllers/categories.controller")
const { Router } = require("express");


let router = Router();


router.route("/").get(controller.getCategories)
router.route("/admin").get(controller.getAdminCategories)
router.route("/add").post(controller.addCategories)
router.route("/delete/:id").delete(controller.deleteCategories)
router.route("/edit/:id").put(controller.editCategories)
router.route("/type/:type").put(controller.getCategoryByType)

module.exports = router;
