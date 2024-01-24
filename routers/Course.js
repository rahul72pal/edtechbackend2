const express = require("express")
const router = express.Router()

//import the Controllers

//Course Controllers
const{
  createCourse,
  allcourses,
  getCourseDetails,
  editCourse,
  getInstructorCourse,
  deleteCourse,
  getFullCourseDetails,
} = require("../controllers/Course");

//Categories Controllers Import
const {
  createCategory,
  allCategory,
  categoryPageDetails,
} = require("../controllers/Category");

//sections Controllers 
const{
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/Section");

//subsections Controllers 
const{
  createSubsection,
  updateSubsection,
  deleteSubSection,
} = require("../controllers/subSection");

//Rating Controlles 
const {
  addRatingAndReview,
  getAverageRating,
  getallReview,
} = require("../controllers/RatingAndReview");

const {
  updateCourseProgress
} = require("../controllers/CourseProgress")

const {auth,isStudent,isInstructor,isAdmin} = require("../middlewares/auth");

//importing the routes

// ********************************************************************************************************
//                                      Course routes
// ********************************************************************************************************

//course can only be Craeted by Instrucor
router.post("/createCourse",auth, isInstructor , createCourse)
//Add a section to a Course
router.post("/createSection",auth, isInstructor , createSection);
//Upadte the section
router.post("/updateSection",auth, isInstructor , updateSection)
//delete a section
router.delete("/deleteSection",auth, isInstructor , deleteSection)
//Add a subsection to a section
router.post("/createSubSection",auth, isInstructor , createSubsection)
//Update the subsection
router.post("/updateSubSection",auth, isInstructor , updateSubsection)
//Delete a subsection
router.delete("/deleteSubSection",auth, isInstructor , deleteSubSection)
// get the All courses
router.get("/getallcourse", allcourses)
//get Details for a specific Course
router.post("/getCourseDetails", getCourseDetails)
// getFullCourseDetails
router.post("/getFullCourseDetails",auth, isStudent, getFullCourseDetails)
//edit course api route
router.post('/editCourse',auth,isInstructor,editCourse)
// get the instructor courses
router.get("/getInstructorCourses", auth , isInstructor , getInstructorCourse)
//dleete a course of the instructor
router.delete("/deleteCourse",auth,isInstructor,deleteCourse)
//mark to complete the video
router.post("/updateCourseProgress",auth, isStudent,updateCourseProgress);

// ********************************************************************************************************
//                                      Category routes
// ********************************************************************************************************
router.post("/createCategory", auth ,isAdmin , createCategory)
router.get("/allCategory", allCategory)
router.post("/getCategoryPageDetails", categoryPageDetails);

// ********************************************************************************************************
//                                      Rating routes
// ********************************************************************************************************
router.post("/addRatingAndReview", auth, isStudent , addRatingAndReview)
// this is temporary for admin to rating and reveiw
// router.post("/addRatingAndReview", auth,isInstructor, addRatingAndReview)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getallReview)

module.exports = router

