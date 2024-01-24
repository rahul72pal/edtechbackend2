const jwt = require("jsonwebtoken");
const User = require("../models/User");
const dotenv = require("dotenv")
dotenv.config();

//auth
module.exports.auth = async (req, res,next)=>{
  try {

    // console.log("REQ = ",req)
    // console.log("INt the middleware auth = ",(req.headers['authorisation'] || '').replace('Bearer ', ''));
    // console.log("INt the middleware auth cokkie = ",req.cookies.Toekn);
    // console.log("INt the middleware auth User = ",req.user)
    const token = req.cookies.Toekn ||
    req.body.token || req.header("Authorisation").replace("Bearer ","");

    console.log("TOKEN = ",token);

    /// token is missing
    if(!token){
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    //verify the token
    try {
      console.log("Before comparing =", process.env.JWT_SECRETE);
      const decode = await jwt.verify(token , process.env.JWT_SECRETE);
      console.log("Decoded payload = ", decode);
      req.user = decode;
      console.log("REQ.USER = ",req.user);
      // console.log("Req User = ",req.user)
      // console.log("User after decode = ",user)
    } catch (error) {
      console.log(error);
      return res.status(401).json({
        success: false,
        message: "Token is invalide while verifying the token plarse chexk"
      })
    }

    next();
    
  }
  catch (error) {
     console.log(error)
    return res.status(401).json({
        success: false,
        message: "Something went wrong the Token is invalide from auht middlewares"
      })
  }
}

// middleware for students
module.exports.isStudent = async (req,res,next)=>{
  try {
    
    if(req.user.accountType !== "Student"){
      return res.status(401).json({
        success: false,
        message: "This is protected route for Student only"
      })
    } 

    next();
      
  } catch (error) {
     console.log(error)
    return res.status(401).json({
        success: false,
        message: "User role cannot be varifie please Try again"
      })
  }
}

//middleware for instructor
module.exports.isInstructor = async(req,res,next)=>{
  try {

    if(req.user.accountType !== "Instructor"){
      return res.status(401).json({
        success: false,
        message: "This is protected route for Instructor only"
      })
    } 

    next();
    
  } catch (error) {
    console.log(error)
    return res.status(401).json({
        success: false,
        message: "User role cannot be varifie please Try again"
      })
  }
}

//is the admin
module.exports.isAdmin = async(req,res,next)=>{
  try {

    if(req.user.accountType !== "Admin"){
      return res.status(401).json({
        success: false,
        message: "This is protected route for Instructor only"
      })
    }

    next();
    
  } catch (error) {
    console.log(error)
    return res.status(401).json({
        success: false,
        message: "User role cannot be varifie please Try again"
      })
  }
}