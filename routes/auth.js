
const express = require('express');

const {check,body} = require('express-validator');

const authController = require('../controllers/auth');
const router = express.Router();
 

router.post('/login',[check('email'),check('password').trim()],authController.login);



router.post('/signup',authController.postSignup);







module.exports = router;
