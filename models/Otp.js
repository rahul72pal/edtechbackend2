const mongoose = require("mongoose");
const {mailSender} = require("../utils/mailSender")
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const otpSchema = new mongoose.Schema({
  email:{
    type: String,
    required: true,
  },
  otp:{
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 5*60, // Set to expire after 5 minutes
  },
});

//a function to send the email
async function sendmailToverification(email,otp){
  try {
    const emailresponse = await mailSender(email, 
                                           "Verification from email",
                                           emailTemplate(otp)
                                          );
    console.log("IN the Models Mail response", emailresponse);
  } catch (error) {
    console.log("error",error);
    throw error
  }
}

//pre middlewares
otpSchema.pre("save", async function(next){
  await sendmailToverification(this.email,this.otp);
  next();
})

module.exports = mongoose.model("OTP", otpSchema);