const path = require('path');

const express = require('express');

const isAuth = require('../middleware/is-auth');

const clinicController = require('../controllers/users');

const router = express.Router();


router.get('/list',isAuth,  clinicController.getIndex);



router.get('/pages/:doctor',isAuth,  clinicController.getDoctor);

router.get('/pages/:doctor/appointment/:appointment',isAuth, clinicController.getAppointment);
router.post('/pages/:doctor/addToFavorite',isAuth, clinicController.postAddtoFavorite);



module.exports = router;
