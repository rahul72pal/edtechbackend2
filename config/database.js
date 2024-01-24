const mongoose = require("mongoose");
const dotenv = require("dotenv");
// require('dotenv').config();

const dbconnect = ()=>{
  // console.log(process.env.DATABASE);
  mongoose.connect( process.env.DATABASE
                   ,{
    useNewUrlParser: true,
      useUnifiedTopology: true,
  }).then(()=>{
    console.log("Connection successfully");
  }).catch((er)=>{
    console.log("error inconnection of DB", er);
    process.exit(1);
  });
};

module.exports = dbconnect;