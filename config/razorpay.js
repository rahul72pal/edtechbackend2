const razorpay = require("razorpay");
// console.log("rzp key ",process.env.RAZORPAY_KEYENV);
const instance = new razorpay({
  key_id: process.env.RAZORPAY_KEYENV,
  key_secret: process.env.RAZORPAY_SECRETENV,
  
})

module.exports = { instance };