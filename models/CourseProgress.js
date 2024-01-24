const mongoose = require("mongoose");

const courseprogressschema = new mongoose.Schema({
  
  courseID:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },

  userID:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  
  completevideos:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubSection",
  }],
  
});

module.exports = mongoose.model("CourseProgress",courseprogressschema);