const controller = require("../controllers/purchase.controller");
const { Router } = require("express");
const oAuthLogin = require("../utils/auth").oAuth;
const { authorize, ADMIN, LOGGED_USER } = require("../utils/auth");
const express = require("express");

let router = Router();

// router.route("/").post(authorize(ADMIN),controller.store);


router.route("/confirm", express.raw({type: 'application/json'})).post(controller.confirm);

module.exports = router;
