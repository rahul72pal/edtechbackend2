const Section = require("../models/Section");
const Course = require("../models/Course");
const Subsection = require("../models/SubSection");

module.exports.createSection = async(req,res) =>{
  try {
    const { sectionName, courseId } = req.body;
    console.log("CREATE SECTION = ", req.body);

    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing Properties",
      });
    }

    const newsection = await Section.create({ sectionName });

    if (!newsection) {
      return res.status(500).json({
        success: false,
        message: "Failed to create a new section",
      });
    }

    const updatecourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newsection._id,
        },
      },
      { new: true }
    )
      .populate({
        path: "courseContent",
        populate: {
          path: "subsection",
        },
      })
      .exec();

    if (!updatecourse) {
      return res.status(500).json({
        success: false,
        message: "Failed to update the course",
      });
    }

    console.log("UPDATED COURSES = ", updatecourse);

    return res.status(200).json({
      success: true,
      message: "Section Created successfully",
      updatecourse,
    });
  } 
 catch (error) {
    console.log(error);
    return res.status(400).json({
        success: false,
        message: "Unable to create the Section "
      });
  }
};

module.exports.updateSection = async(req,res)=>{
  try {
     // console.log("Update the section");
     // console.log(req);
    const {sectionName , sectionId,courseId} = req.body;
    console.log(req.body);
    console.log("body=",sectionName , sectionId)

    if(!sectionName || !sectionId){
      return res.status(400).json({
        success: false,
        message: "Missing Properties"
      });
    }

    const section = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new:true});

    const course = await Course.findByIdAndUpdate(courseId)
      .populate({
        path: "courseContent",
        populate:{
          path: "subsection",
        },
      }).exec();

    return res.status(200).json({
      success: true,
      message: "Section Updated successfully by rahul pal",
      data:course
    });
    
  } catch (error) {
    console.log(error);
    return res.status(400).json({
        success: false,
        message: "Unable to update the Section "
    });
  }
};

module.exports.deleteSection = async(req,res)=>{
      try {
        const { sectionId } = req.body;
    
        // Find the section
        const section = await Section.findById(sectionId);
    
        // Check if the section exists
        if (!section) {
          return res.status(404).json({
            success: false,
            message: "Section not found",
          });
        }
    
        // Delete all subsections in the section
     const deletedsubsection = await Subsection.deleteMany({ _id: { $in: section.subsection } });
        console.log("DELETED SUB SECTION IN = ",deletedsubsection);
    
        // Delete the section
        await Section.findByIdAndDelete(sectionId);
    
        // Remove the section from the course
        const updatedCourse = await Course.findOneAndUpdate(
          { courseContent: sectionId },
          {
            $pull: {
              courseContent: sectionId,
            },
          },
          { new: true }
    ).populate({
      path: "courseContent",
      populate: {
        path: "subsection",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
      data: updatedCourse,
    });
  }catch (error) {
    console.log(error);
    return res.status(400).json({
        success: false,
        message: "Unable to delete the Section "
    });
  }
}