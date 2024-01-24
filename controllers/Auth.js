const User = require("../models/User");
const OTP = require("../models/Otp");
// const otpgenrator = require("otp-generator"); 
const otpGenerator = require('otp-generator')
const Profile = require("../models/Profile");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mailsender = require("../utils/mailSender")
const bcrypt = require("bcrypt");
const {passwordUpdated} = require("../mail/templates/passwordUpdate")
const {mailSender} = require("../utils/mailSender")

//otp genrator
module.exports.sendOtp = async( req,res)=>{
  try {
    const {email} = req.body;
  
    const userExist = await User.findOne({email});
  
    if(userExist){
      return res.status(401).json({
        success: false,
        message: "User already register",
      })
    }
    //genarte the otp
    // var otp = otpgenrator.genrate(6,{
    //   upperCaseAlphabets: false,
    //   lowerCaseAlphabets: false,
    //   specialChars: false,
    // });
    var otp = otpGenerator.generate(6,
                                    { upperCaseAlphabets: false,
                                     lowerCaseAlphabets: false,
                                     specialChars: false
                                    }
                                   );
  
    // console.log("genrate otp = ",otp);
  
    //check unique otp or not 
    const result = await OTP.findOne({otp: otp});
  
    while(result){
      otp = otpgenrator(6,{
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({otp: otp});
    }
  
    const otppayload = {email , otp};
    const otpbody = await OTP.create(otppayload);
    await otpbody.save();
  
    // console.log(" In the send OTP ", otpbody);
  
    return res.status(200).json({
      success:true,
      message: "OTP sent successfully",
      otp: otp
    })
    
  } catch (error) {
    // console.log("error in otp send");
    console.log(error)
    return res.status(500).json({
      success:false,
      message: "OTP NOT sent successfully",
      error : error.message
    })
  }
}

//signup 
module.exports.Singup = async (req,res)=>{
  try {
    
    const {
      firstName , lastName , 
      email, password , confirmPassword,
      accountType ,contactNumber , otp
    } 
    = req.body;

    console.log(firstName ,lastName , 
               email, password , confirmPassword,
               accountType , otp);

    //validation 
    if(!firstName || !lastName || !email || !password|| !confirmPassword || !otp){
      return res.status(403).json({
        success: false,
        message: "Fill the required fields carefully ",
      })
    }

    if(password !== confirmPassword){
      return res.status(400).json({
        success: false,
        message: "Password and confirmpassword Does Not matched ",
      })
    }

    const userexist = await User.findOne({email:email});
    if(userexist){
      return res.status(400).json({
        success: false,
        message: "User already exist Go to login page",
      })
    }

    //find the most recentOtp 
    const recentotp = await OTP.findOne({email}).sort({createdAt: -1}).limit(1);
    console.log("Recent otp", recentotp);

    if(recentotp && recentotp.lenght == 0){
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      })
    }else if(otp !== recentotp.otp){
      return res.status(400).json({
        success: false,
        message: "Invalid OTP found",
      })
    }

    //harsde the paasword 
    const hashedpasswrod = await bcrypt.hash(password,10);

    //entry created in DB

    const profileDetails = await Profile.create({
      gender:null,
      dateOfBirth:null,
      about:null,
      contactNumber:null
    });
    
    const user = await User.create({
      firstName , lastName , 
      email, password:hashedpasswrod ,
      // contactNumber:contactNumber,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
    })

     return res.status(200).json({
      success:true,
      message: "User Singin successfully",
      user: user
    })
    
  } catch (error) {
    console.log("error in otp send");
    console.log(error)
    return res.status(500).json({
      success:false,
      message: "User NOT singin successfully",
      error : error.message
    })
  }
}

//login 
module.exports.login = async( req,res)=>{
  try {
    const {email , password} = req.body;
    console.log("LOGIN DATA = ", req);

    //validation 
    if( !email || !password){
      return res.status(403).json({
        success: false,
        message: "Fill the required fields carefully ",
      })
    }
    
    
    const user = await User.findOne({email}).populate("additionalDetails");
    
    if(!user){
      return res.status(401).json({
        success: false,
        message: " User Not Found dor login",
      })
    }

    if(await bcrypt.compare(password , user.password)){
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType, 
      }
      const token = jwt.sign(payload , process.env.JWT_SECRETE,{
        expiresIn: "5h",
      });
      user.token = token;
      user.password = undefined

      //create cookie and give me response
      const options = {
        expires: new Date(Date.now() + 3*24*60*60*1000),
        httpOnly: true,
      }
      res.cookie("Toekn", token ,options).status(200).json({
        success: true,
        token , 
        user,
        message: "User logged in successfully"
      })
    }

    else{
      return res.status(401).json({
        success: false,
        message: "Password is Does not Machted"
      })
    }
    
  } catch (error) {
    console.log("error in otp send");
    console.log(error)
    return res.status(500).json({
      success:false,
      message: "User NOT login successfully",
      error : error.message
    })
  }
}

//change password 
module.exports.changePassword = async(req,res)=>{
  try {
    const userId = req.user.id;

    const userDetails = await User.findById(userId);

    //get the old password newpassword and confirmpassword 
    console.log("CHANGE PPASSWORD = BODY =",req.body);
    const {oldPassword , newPassword } = req.body;

    //Validation
    const isPasswordMatch = await bcrypt.compare(
      oldPassword , 
      userDetails.password
    );

    if(!isPasswordMatch){
      // 401 for unAuhtorised error
      return res.status(401).json({
        success: false,
        message: "Current Password Does not Machted"
      })
    }

    //Match new password and confoirm nw password
    // if(newPassword !== confirmPassword){
    //   //400 for badrequest
    //   return res.status(400).json({
    //     success: false,
    //     message: "New Password and Confirm Password is Does not Machted"
    //   })
    // }

    //upadte the passowrd
    const encrytedPassword = await bcrypt.hash(newPassword,10);
    const updateUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      {password: encrytedPassword},
      {new: true}
    );

    //send notification email
    try {
      const emailresponse = await mailSender(
        updateUserDetails.email,
        "Update the Password from from the Study Notion",
        passwordUpdated
        (
          updateUserDetails.email,
          `Password update successfully for${updateUserDetails.firstName} ${updateUserDetails.lastName}`
        )
        );

      console.log("Updated User Details = ",updateUserDetails);
      console.log("email response",emailresponse.response);
      
    } catch (error) {
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }

    //return the resposne
    return res.status(200).json({
      success: true,
      message: "Password Updated Successfully",
    })
  } catch (error) {
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    });
  }
}

