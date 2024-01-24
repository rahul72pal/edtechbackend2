const express = require('express');
const router = express.Router();
// const User = require('../models/User');

//import the require controller and middlewares
const {
  login,
  Singup,
  sendOtp,
  changePassword,
} = require("../controllers/Auth");

const {
  resetPasswordToken,
  resetPassword,
} = require("../controllers/ResetPassword");

const {auth} = require("../middlewares/auth");

//routes for login , singup , and Auhtentication
// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************
router.post("/login", login);
router.post("/signup", Singup);
router.post("/sendotp", sendOtp);
router.post("/changePassword", auth, changePassword);

// ********************************************************************************************************
//                                      Reset Password routes
// ********************************************************************************************************
//route for genrating the password token
router.post("/resetPasswordToken", resetPasswordToken);
//route for reseting the password
router.post("/resetPassword", resetPassword);

//exports the router use in the main appliaction
module.exports = router;
