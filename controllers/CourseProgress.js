const SubSection = require("../models/SubSection");
const CourseProgress = require("../models/CourseProgress");

module.exports.updateCourseProgress = async(req,res)=>{
  try {
    
    const {courseId , subsectionId} = req.body;
    const userId = req.user.id;

    const subsection = await SubSection.findById(subsectionId);

    if(!subsection){
      return res.status(404).json({ success: false, message: "subsection not found"})
    }

    //check foe old entity
    let courseProgress = await CourseProgress.findOne({courseID:courseId,userID:userId});

    if(!courseProgress){
      return res.status(404).json({
        success: false , 
        message: "CourseProgress not found for the Course"
      });
    }

    else{
      if(courseProgress.completevideos.includes(subsectionId)){
        return res.status(400).json({ success: false, message: "Already Completed"});
      }
      //push into compltedted videos
      courseProgress.completevideos.push(subsectionId);
    }

    await courseProgress.save();

    return res.status(200).json({ success: true, message: "Subsection Completed"});
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the CourseProgress",
    });
  }
}