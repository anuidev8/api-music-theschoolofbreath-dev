const controller = require('../controllers/auth.controller')
const { Router } = require('express')
const oAuthLogin = require('../utils/auth').oAuth;
const { authorize, ADMIN, LOGGED_USER } = require('../utils/auth');

let router = Router()

router
    .route('/register')
    .post(controller.store)

router
    .route('/login')
    .post(controller.login)
router
    .route('/generateResetToken')
    .post(controller.generateResetToken)
router
    .route('/resetPassword')
    .post(controller.resetPassword)

router
    .route('/changepassword')
    .post(authorize(LOGGED_USER), controller.changePassword)







module.exports = router
