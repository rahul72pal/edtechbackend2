const cloudinary = require('cloudinary').v2;
const dotenv = require("dotenv");

const cloudinaryconnect = ()=>{
  try {
    // console.log(process.env.CLOUD_NAME);
    // console.log(process.env.API_KEY);
    // console.log(process.env.API_SECRETE);
      cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.API_KEY, 
        api_secret: process.env.API_SECRETE,
        secure: true
     });
  } catch (error) {
    console.log(error);
    console.log("Error in cloudinary connections")
  }
}


module.exports = cloudinaryconnect;
