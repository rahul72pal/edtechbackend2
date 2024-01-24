const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const {imageuplaod} = require("../utils/imageuploadtocloudinary");
require("dotenv").config();

module.exports.createSubsection = async(req,res)=>{
  try {

     // timeDuration 
    console.log(req.body);
    const {sectionId , title ,description}= req.body;

    const video = req.files.videoUrl;
    // console.log("Subsection Details is here = ",sectionId , title ,description,video)
    // console.log("CREATE SUBSECTION DATA = ",req);

    if(!sectionId || !title ||
       // !timeDuration ||
       !description ||!video){
      return res.status(400).json({
        success: false,
        message: "fields is not filled correctlly in Subsection",
      });
    }

    const uploadDetails = await imageuplaod(video , process.env.FOLDER_NAME); 

    const newsubSection = await SubSection.create({
      title:title,
      timeduration: `${uploadDetails.duration}`,
      description: description,
      videoUrl : uploadDetails.secure_url
    })

    const updatesection = await Section.findByIdAndUpdate(
      {_id: sectionId},
      {
        $push:{
          subsection:newsubSection._id
        }
      },
      {new: true}
    ).populate("subsection");
    //HW log update section Here After adding populate query

    return res.status(200).json({
       success: true,
       message: "Subsection Created successfully ",
      newsubSection,
      updatesection
    })
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
        success: false,
        message: "Unable to create the subsection ",
      });
  }
}

//HW  update the subsection
module.exports.updateSubsection = async(req,res)=>{
  try{
    // console.log(req.body);
    // console.log("UPDATE SUBSECTION CALLED = ");
    const {subsectionId , title , description ,sectionId}= req.body
    const subSection = await SubSection.findById(subsectionId);
    console.log("DATA REQUEST BODY updated subsection = ",req.body);

    if(!subSection){
      return res.status(404).json({
        success: false,
        message: "Subsection not found",
      })
    }
    
    if(title !== undefined){
      subSection.title = title;
    }

    if(description !== undefined){
      subSection.description = description;
    }
    
    if(req.files && req.files.video !== undefined){
      const video = req.files.video;
      const uploadDetails = await imageuplaod(video , process.env.FOLDER_NAME); 
      subSection.videoUrl = uploadDetails.secure_url;
      subSection.timeDuration = `${uplaodDetails.duration} mins`}

    await  subSection.save();

    const newsection = await Section.findById(sectionId)
    .populate("subsection").exec();

    // console.log("New SECTION IS HERE = ",newsection);

    return res.status(200).json({
      success: true,
      messgae: "Subsection updated successfully",
      data: newsection
    })
  }   
  catch(error){
    console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
}
//Hw delete the subsection
// module.exports.deleteSubSection = async(req,res)=>{
//   try{
//     const {sectionId , subSectionId} = req.body;
//     console.log("SUBSECTION DESLETE BODY IS HERE = ",req.body);
//     // const section = await Section.findById(sectionId);
   

//     const section = await Section.findByIdAndUpdate(
//       {_id: sectionId},
//       {
//         $pull: {
//           subsection: subSectionId
//         }
//       },
//       {new: true}
//     )

//     const subSection = await SubSection.findByIdAndDelete({_id:subSectionId});

//     if (!subSection) {
//       return res
//         .status(404)
//         .json({ success: false, message: "SubSection not found" })
//     }

//     return res.json({
//       success: true,
//       message: "SubSection deleted successfully",
//       data: section,
//       // subsection: subSection
//     })
    
//   }
//   catch(error){
//     console.error(error)
//     return res.status(500).json({
//       success: false,
//       message: "An error occurred while deleting the SubSection",
//     })
//   }
// }

module.exports.deleteSubSection = async (req, res) => {
  try {
    const { sectionId, subsectionId } = req.body;
    console.log("SUBSECTION DELETE BODY IS HERE = ", req.body);

    // Ensure that subsectionId is defined
    if (!subsectionId) {
      return res.status(400).json({
        success: false,
        message: "SubSectionId is required in the request body.",
      });
    }

    // Update your code to use subsectionId
    const section = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subsection: subsectionId,
        },
      },
      { new: true }
    );

    const subSection = await SubSection.findByIdAndDelete({ _id: subsectionId });

    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" });
    }

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data: section,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    });
  }
};

