const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const User = require("../models/User");

module.exports.addRatingAndReview = async(req,res)=>{
  try {

    console.log("COURSE RATING ADD BODY = ",req.body);
    const {courseId, review , rating} = req.body;
    const userId = req.user.id;

    const courseDetails = await Course.findOne(
      {_id: courseId,
       studentenrolled: {$elemMatch: {$eq : userId} },
      }
    );

    console.log(courseDetails);

    if(!courseDetails){
      return res.status(404).json({
        success: false,
        message: "CourseDetails Does not Found",
      })
    }

    //check weather they give already review the 
    const alreadyReview = await RatingAndReview.findOne({
      course: courseId,
      user: userId,
    });

    if(alreadyReview){
      return res.status(403).json({
        success: false,
        message: "Course is also revie by user",
      })
    }

    //create the rating and review
    const ratingandreview = await RatingAndReview.create({
      rating, review,
      course: courseId,
      user: userId,
    });

    //update the course with user rating and reqview
   const updateCourseDeatils =  await Course.findByIdAndUpdate({_id:courseId},
                                   {
                                     $push: {ratingandreviws: ratingandreview._id},
                                   }
                                  ,{new: true}
                                  );
    
    console.log(updateCourseDeatils);
    
    return res.status(200).json({
      success: true,
      message: "Rating and Review was successfully",
      ratingandreview: ratingandreview
    })
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in fetching the course Details",
    })
  }
}

//get the Average Rating of the User
module.exports.getAverageRating = async(req,res)=>{
  try {

    const courseId = req.body;
    const result = await RatingAndReview.aggregate([
      {
        $match:{
          course: new mongoose.Types.ObjectId(courseId),
        }
      },
      {
        $group:{
          _id: null,
          averageRating: {$avg : "$rating"},
        }
      }
    ]);

    console.log(result);

    if(result.length >0 ){
      return res.staus(200).json({
        success: true,
        message: "Average Rating Founnd",
        data: result[0].averageRating,
      })
    }

    //if no rating and reviews exits
    return res.status(200).json({
      success: false,
      message: "No Rating and review exits"
    })
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in fetching the Avg rating Details",
    })
  }
}

//get all rating and reveiws
module.exports.getallReview = async(req,res)=>{
  try {

    const allReviews = await RatingAndReview.find({})
                                  .sort({rating: "desc"})
    .populate({
      path: "user",
      select: "firstName lastName email image",
    
    })
    .populate({
      path: "course",
      select: "courseName"
    })
    .exec();

    return res.status(200).json({
      success: true,
      message: "Getting all Reviews of the Course",
      data: allReviews
    })
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in fetching the all  reviws"
    })
  }
}