const controller = require("../controllers/contact.controller")
const { Router } = require("express");


let router = Router();


router.route("/").get(controller.getContacts)
router.route("/all").get(controller.getAllContacts)
router.route("/subscriptions/:contactId").get(controller.getSubscriptions)


module.exports = router;
