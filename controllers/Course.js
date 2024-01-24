const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const {imageuplaod} = require("../utils/imageuploadtocloudinary")
const mongoose = require('mongoose');
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const CourseProgress = require("../models/CourseProgress");
const { convertSecondsToDuration } = require("../utils/secToDuration")

module.exports.createCourse = async (req,res) =>{
  try {

    // console.log("REQUEST BODY = ",req.files);
    const {courseName,
  courseDescription,
  whatYouWillLearn,price
           , tag,category,instructions
           ,status} = req.body

    const thumbnail = req.files.thumbnail;
    // console.log("Files = ",req.courseImage);
    
    // console.log("Files = ",req);

    // console.log("Thumbnail is here = ",thumbnail);
    // console.log("Deatils is Here = ",courseName,
    //            courseDescription,
    //            whatYouWillLearn,price , tag,Category)
    // console.log(req);
    console.log(courseName,
               courseDescription,
               whatYouWillLearn,price ,
                tag,
                category,instructions,status);

    if(
      !courseName || 
      !courseDescription || 
      !instructions ||
      !whatYouWillLearn ||
      // !thumbnail ||
      !price ||
      // !tag||
      !category
    ){
      return res.status(400).json({
        success:false,
        message: "All fields are required",
      })
    }

    // console.log(Category);
    const categoryId = new mongoose.Types.ObjectId(category)
    // console.log(objectId);
    // const Categorydetails = await Category.findById(category)
    
    // console.log(Categorydetails);
    

    const userId = req.user.id;
    const instructoedetails = await User.findById(userId);
    // console.log("Instrucor Details = ",instructoedetails);

    if(!instructoedetails){
      return res.status(404).json({
        success: false,
        message: "Instructor details is not Found"
      })
    }

    const uploadthumbnail = await imageuplaod(thumbnail, process.env.FOLDER_NAME);

    const newCours = await Course.create({
      courseName,
      courseDescription,
      whatYouWillLearn,
      instructor:instructoedetails._id,
      price,
      // Category: Categorydetails._id,
      // category: Categorydetails._id,
      category: categoryId,
      tag: tag,
      thumbnail:uploadthumbnail.secure_url,
      instructions: instructions,
      status:status,
      createdAt: Date.now(),
    });

   const updateuser =  await User.findByIdAndUpdate(
      {_id:instructoedetails._id},
      {
        $push:{
          courses: newCours._id,
        }
      },
      {new: true}
    )
    updateuser.save();

    const Categorydetails = await Category.findByIdAndUpdate(
      { _id: categoryId },
      {
        $push:{
          course: newCours._id,
        }
      },
      {new: true}
    )
    Categorydetails.save();

    if(!Categorydetails){
      return res.status(404).json({
        success: false,
        message: "Category details is not Found"
      })
    }

    //update the tagg schema;
    return res.status(200).json({
      success: true,
      message: "Course Created successfully",
      data:newCours,
      user:updateuser
    });
    
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      success: false,
      message: " Error Course Created successfully",
    });
  }
}

module.exports.allcourses = async (req,res)=>{
  try {
    // const allcourses = await Course.find({},{
    //   courseName: true,
    //   coursedescription: true,
    //   price: true,
    //   instructor: true,
    //   thumbnail: true,
    //   studentenrolled: true,
    // }).populate("instructor")
    // .exec();

    const allcourses = await Course.find({});

    return res.status(200).json({
      success: true,
      message: "Course Created successfully",
      data:allcourses
    });

    
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      success: false,
      message: " Error All Course Created successfully",
    });
  }
}

module.exports.getCourseDetails = async(req,res)=>{
  try {

    console.log("Course Details body = ",req);
    const {courseId} = req.body;

    if(!courseId){
      return res.status(400).json({
        success: false,
        message: "Does not get Course Id"
      })
    }
    
    const courseDetails = await Course.findOne(
      {_id: courseId})
    .populate(
      {
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      }
    )
    .populate("category")
    .populate("ratingandreviws")
    .populate(
      {
        path: "courseContent",
        populate: {
          path: "subsection",
        },
      }
    )
    .exec();

    // console.log("COURSE DETAILS id = 134",courseDetails._id);
    // console.log("COURSE DETAILS tag = 134",courseDetails.tag);

    if(!courseDetails){
      return res.status(404).json({
        success: false,
        message: "CourseDetails Does not Found",
      })
    }

    return res.status(200).json({
      success: true,
      message: "CourseDeatils Found by rahul pal",  
      data: courseDetails
    })
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in fetching the course Details",
    })
  }
}

module.exports.editCourse = async(req,res)=>{
  try {
    
    const {courseId} = req.body;
    const updates = req.body;
    const course = await Course.findById(courseId);
    console.log("EDITCOURSE REQUEST BODY = ",req.body);

    if(!course){
      return res.status(404).json({
        success: false,
        message: "Course Details is not Found",
      })
    }

    // if thumbnail Image is fount than update this
    if(req.files){
      const uploadthumbnail = await imageuplaod(
        req.files.thumbnail,
        process.env.FOLDER_NAME
      );
      course.thumbnail = uploadthumbnail.secure_url;
    }

    //update only the fiels theat are only present in the reques
    for (const key in updates){
      if(updates.hasOwnProperty(key)){
        if (key === 'tag' || key === 'instructions') {
          if (Array.isArray(updates[key])) {
            // Convert array to a comma-separated string
            course[key] = updates[key].join(', ');
          } else {
            course[key] = updates[key];
          }
        } else {
          course[key] = updates[key];
        }
      }
    }

    await course.save();

    const updatescourse = await Course.findOne(
      {_id: courseId}).
      populate({
        path: "instructor",
        populate:{
          path: "additionalDetails",
        }
      })
    .populate("category")
    .populate("ratingandreviws")
    .populate({
      path: "courseContent",
      populate:{
        path: "subsection"
      }
    }).exec();

    return res.status(200).json({
      success: true,
      message: "Course Updates successfully",
      data: updatescourse,
    })
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in fetching the course Updates",
    })
  }
}

module.exports.getInstructorCourse = async(req,res)=>{
  try {

    console.log("INSTRUCTOR COURSE REQUEST BODY = ",req.body);
    const instructorId = req.user.id;

    const instructorCourses = await Course.find({
      instructor: instructorId,
    }).sort({createdAt: -1}).populate({
      path: 'courseContent',
      model: 'Section', // Model name for the courseContent
      populate: {
        path: 'subsection',
        model: 'SubSection', // Model name for the subsection
      },
    }).exec()

    // console.log("INSTRUCTOR COURSE RESPONSE = ",instructorCourses);

    // let totalDurationInSeconds = 0
    //   instructorCourses.courseContent.forEach((content) => {
    //   content.subsection.forEach((subSection) => {
    //     const timeDurationInSeconds = parseInt(subSection.timeduration)
    //     totalDurationInSeconds += timeDurationInSeconds
    //   })
    // })

    // const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

    // instructorCourses.duration = totalDuration;

    // let totalDurationInSeconds = 0;

    instructorCourses.forEach((course) => {
      let totalDurationInSeconds = 0; // Reset total duration for each course
      course.courseContent.forEach((content) => {
        content.subsection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeduration) || 0;
          totalDurationInSeconds += timeDurationInSeconds;
        });
      });
      course.duration = totalDurationInSeconds;
      console.log(course.duration);
    });

    // Assuming you have a function to convert total seconds to HH:MM:SS format
    // const totalDuration = convertSecondsToDuration(totalDurationInSeconds);
    console.log("Total instructorCourses: ", instructorCourses);

    //return the instructor courses
    return res.status(200).json({
      success: true,
      message: "instructor courses",
      data: instructorCourses,
    })

    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in fetching the course INSTRUCTOR COURSES",
    })
  }
}

module.exports.deleteCourse = async(req,res)=>{
  try {

    console.log("COURSE DELETE REQ.BODY =",req.body);
    const {courseId} = req.body;
    // const course = Course.findById(courseId).exec();
    const courseQuery = Course.findById(courseId);

    // Execute the query to get the course details
    const course = await courseQuery.exec();
    
    if(!course){
      return res.status(404).json({
        success: false,
        message: "Course Details is not Found",
      })
    }

    console.log(" COURSE OF ID = ",course);
    const studentEnrolled = course.studentenrolled;
    console.log("STUDENT ENROLLER = ",studentEnrolled);
    for(const student of studentEnrolled){
      await User.findByIdAndUpdate(student,{
        $pull: {courses: courseId}
      })
    }

    //delete the section and subsection
    const courseSection = course.courseContent;
    for(const sectionId of courseSection){
      //delete the subsection of the section
      const section = await Section.findById(sectionId);
      if(section){
        //delete the subsection
        const subsection = section.subsection;
        for(const subsectionId of subsection){
          await SubSection.findByIdAndDelete(subsectionId);
        }
      }

      //delete the section 
      await Section.findByIdAndDelete(sectionId);
    }

    //delete the course 
    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      success: true,
      message: "Course Deleted successfully",
    })
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in deleting the course INSTRUCTOR COURSES",
    })
  }
}

module.exports.getFullCourseDetails = async (req,res) =>{
  try {

    console.log("USER REQUEST = ",req.body.data);
    const {courseId} = req.body.data;
    const userId = req.user.id;

    if(!courseId){
      return res.status(400).json({
        success: false,
        message: "Please provide the courseId",
      })
    }
    
    // Find the course by ID and populate the details of the courseContent
    const course = await Course.findById(courseId).populate({
      path: 'courseContent',
      model: 'Section', // Model name for the courseContent
      populate: {
        path: 'subsection',
        model: 'SubSection', // Model name for the subsection
      },
    }).exec();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userID: userId
    }) || 0;

    // if(!courseProgressCount){
    //   return res.status(404).json({
    //     success: false,
    //     message: 'courseProgressCount not found',
    //   });
    // }

    // console.log("COURSE PROGRESS COUNT = ",courseProgressCount);

    let totalDurationInSeconds = 0;
    course.courseContent.forEach((content)=>{
      content.subsection.forEach((subsection)=>{
        const timeDurationInseconds = parseInt(subsection.timeduration);
        totalDurationInSeconds += timeDurationInseconds
      })
    })

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    return res.status(200).json({
      success: true,
      message: 'Course details found',
      data: {
        course,
        totalDuration,
        completedVideos: courseProgressCount?.completevideos
        ? courseProgressCount.completevideos 
          : [],
      }
    });
    
  } catch (error) {
    console.error('Error in getFullCourseDetails:', error);
    return res.status(500).json({
        success: false,
        message: 'Error in fetching course details',
        error: error.message
    })
  }
}
