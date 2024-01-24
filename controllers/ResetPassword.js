const User = require("../models/User");
const {mailSender} = require("../utils/mailSender")
const crypto = require("crypto");
const bcrypt = require("bcrypt");

//resetpasswordtoken
module.exports.resetPasswordToken = async (req,res)=>{
  try {

    //fetch the email
    const {email} = req.body;
    //check the email
    const user = await User.findOne({email: email});
    if(!user){
      return res.json({
        success: false,
        message: "You are not register fo rthis"
      });
    }
    //genarte the token for frontend
    const token = crypto.randomUUID();
    //update the user by token and expiresTime
    const updateuser = await User.findOneAndUpdate(
      {email: email},
      {
        token: token,
        resetPasswordExpires: Date.now() + 1*60*1000,
      },
      {new: true}
    )
    //create url
    const url = `http://localhost:3000/upadate-password/${token}`
    //send email conating url
    await mailSender(email , "Password Resent Link",`Password resent Link ${url}`);
    //return response
    return res.json({
      success: true,
      message: "Email sent successfully Please check your email and change your password",
      token: token
    })
    
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during the resset pawssword token"
    });
  }
}

//resetpassword
module.exports.resetPassword = async(req,res)=>{
  try {
    // here is token of crypto
    const {password , confirmPassword , token} = req.body;
    console.log(password,confirmPassword,token)

    if(password !== confirmPassword){
      return res.json({
        success: false,
        message: "Password does not matched plaese make sure both password are same"
      })
    }

    const userdetails = await User.findOne({token: token});

    if(!userdetails){
      return res.json({
        success: false,
        message: "Token is invalid"
      })
    }

    console.log(userdetails.resetPasswordExpires);

    if(userdetails.resetPasswordExpires < Date.now()){
      return res.json({
        success: false,
        message: "Token is expires please regenrate the token"
      })
    }

    const hashedpasssowrd = await bcrypt.hash(password,10)

    await User.findOneAndUpdate(
      {token: token},
      {password: hashedpasssowrd},
      {new: true}
    )

    return res.status(200).json({
      success: true,
      message: "Password Resset successfully go to Login Page"
    });
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Error in Password Resset successfully"
    })
  }
}