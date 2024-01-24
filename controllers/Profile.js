const Profile = require("../models/Profile");
const User = require("../models/User");
const {imageuplaod} = require("../utils/imageuploadtocloudinary")
const cloudinary = require('cloudinary').v2;
const Course = require("../models/Course");
const {convertSecondsToDuration} = require("../utils/secToDuration")
const CourseProgress = require("../models/CourseProgress");

// how to sedule the request for delete the account  

module.exports.updateProfile = async(req,res)=>{
  try {
    
    const {dateOfBirth="", about="", contactNumber , gender}= req.body;

    const id = req.user.id;

    if(!contactNumber || !gender || !id){
      return res.status(400).json({
        success: false,
        message: "Fields are not required",
      });
    }

    const UserDetails = await User.findById(id);

    const profileId = UserDetails.additionalDetails;

    const ProfileDrtails = await Profile.findById(profileId);

    console.log(dateOfBirth);
    ProfileDrtails.dateOfBirth = dateOfBirth;
    ProfileDrtails.about = about;
    ProfileDrtails.gender = gender;
    ProfileDrtails.contactNumber = contactNumber;
    await ProfileDrtails.save();

    // const updatedUserDetails = await User.findById(
    //   {_id: }
    // )
   const updatedUserDetails = await User.findById(
      {_id: id},
    ).populate("additionalDetails").exec();

    return res.status(200).json({
      success: true,
      message: "Profile is created successFully",
      ProfileDrtails,
      updatedUserDetails
    })
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
        success: false,
        message: "Unable to create the profile section",
        error: error.message
      });
  }
}

module.exports.deleteAccount = async(req,res)=>{
  try {
    const id = req.user.id;

    // console.log(id);
    const userDetails = await User.findById(id);
    // console.log("User Details = ",userDetails);
    
    if(!userDetails){
      return res.status(400).json({
        success: false,
        message: "User are not required",
      });
    }

    await Profile.findByIdAndDelete({_id:userDetails.additionalDetails});

    await User.findByIdAndDelete({_id:id});
    //Hw to unenroll user from all enroll courses;

    //deleting the image from backend server
    if(userDetails.publicID){
      const publicid = userDetails.publicID;
      await cloudinary.uploader.destroy(publicid);
      console.log("image deleted from the cloudinary");
    }
    

    return res.status(200).json({
        success: true,
        message: "Profile deleted successfully",
      });
    
  } 
  catch (error) {
    console.log(error);
    return res.status(500).json({
        success: false,
        message: "Unable to delete the profile section",
        error: error.message
      })
   }
  
}

module.exports.getAllUserDetails = async( req,res)=>{
  try {
    
    const id = req.user.id;

    const userDetails = await User.findById(id)
      .populate("additionalDetails").exec();

    return res.status(200).json({
      success: true,
      message :"User All Details fetched ",
      userDetails
    })
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
        success: false,
        message: "Unable to get all the details of users",
    });
  }
}

module.exports.updateDisplayPicture = async(req,res)=>{
  try {
    const displaypicture = req.files.displayPicture
    const userId = req.user.id
    const image  = await imageuplaod(
      displaypicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    )
    console.log(image.public_id);
    const updateUserProfile = await User.findByIdAndUpdate(
      {_id: userId},
      {
       image: image.secure_url,
       publicID: image.public_id
      },
      {new: true}
    )

    console.log(updateUserProfile.publicID);

    res.send({
      success: true,
      message: `Image updated successfully`,
      data: updateUserProfile,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

module.exports.getEnrolledCourses = async(req,res)=>{
  try {

    // console.log(req.user);
    const userId = req.user.id;
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: 'courses',
        populate: {
          path: 'courseContent',
          model: 'Section',
          populate: {
            path: 'subsection',
            model: 'SubSection',
          },
        },
      })
      .exec();

    userDetails = userDetails.toObject()
    var SubsectionLength = 0
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0
      SubsectionLength = 0
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subsection.reduce((acc, curr) => acc + parseInt(curr.timeduration), 0)
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        )
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subsection.length
      }
      let courseProgressCount = await CourseProgress.findOne({
          courseID: userDetails.courses[i]._id,
          userID: userId,
      })
      console.log("COURSE PROGRESSS IS HERE = ",courseProgressCount);
      console.log("SUBSECTION LENGTH IS HERE FOR COURSE = ",SubsectionLength
                  // ,userDetails.courses[i]
                 );
      courseProgressCount = courseProgressCount?.completevideos.length
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2)
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier
      }
    }

    //extra login is here

    if(!userDetails){
      return res.status(400).json({
        success: false,
        message: `User are not required`,
      })
    }

    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    })
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: error.message,
      error: error
    })
  }
}

module.exports.instructorDashboard = async(req,res)=>{
  try {
    
    const courseDetails = await Course.find({instructor: req.user.id});

    if(!courseDetails){
      return res.status(401).json({
        success: true,
        message: "Course Details not found for Instructor"
      })    
    }

    const courseData = courseDetails.map((course)=>{
      const totalStudentEnrolled = course.studentenrolled.length;
      const totalAmountGenrated = course.price * totalStudentEnrolled;

      const courseDatawithState = {
        _id: course._id,
        courseName: course.courseName,
        courseDscription: course.courseDescription,
        coursePrice: course.price,
        totalStudentEnrolled,
        totalAmountGenrated,
      }
      return courseDatawithState;
    })

    return res.status(200).json({success: true , data: courseData});
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: true,
      message: "Error in instructor Dashboard"
    })
  }
}