const controller = require("../controllers/email.controller");
const { Router } = require("express");

let router = Router();

// Send email reply
router.route("/reply").post(controller.sendEmailReply);

// Get email configuration
router.route("/config").get(controller.getEmailConfig);

module.exports = router; 