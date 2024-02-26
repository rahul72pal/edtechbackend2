const nodemailer = require("nodemailer");
require("dotenv").config();

module.exports.mailSender = async(email , title , body)=>{
  try {
    // console.log(email,title,body);
    let transporter = nodemailer.createTransport({
      host:process.env.MAIL_HOST,
      auth:{
        user:process.env.MAIL_USER,
        pass:process.env.MAIL_PASS
      }
    })
    //  console.log(transporter);
    //send the mail
    let info = await transporter.sendMail({
      from: ` "OTP From study Notion Backend" <muskanpal395@gmail.com>`,
      to: `"Dear Student" <${email}>`,
      subject: `${title}`,
      html: `${body}`
    });

    console.log("INFO = ",info);
    return info;
    
  } catch (error) {
    console.log("Main Error =",error);
    console.log(error.message);
  }
}