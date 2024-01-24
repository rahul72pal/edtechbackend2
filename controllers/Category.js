const Category = require("../models/Category");
const mongoose = require("mongoose");

module.exports.createCategory = async (req,res)=>{
  try {
    
    const {name , description} = req.body;

    if(!name || !description){
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })
    }

    //create the tag
    const Categorydetails = await Category.create({
      name,
      description
    });
    
    console.log(Categorydetails);

    return res.status(200).json({
      success: true,
      message: "Category created successfully",
    })
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
};

module.exports.allCategory = async (req,res)=>{
  try {

    const alltags = await Category.find({},{name:true, description:true,});
    
    return res.status(200).json({
      success: true,
      message: "All tags are required",
      data: alltags
    });
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
};

//categoryPageDetails
module.exports.categoryPageDetails = async(req,res)=>{
  try {
    const { categoryId } = req.body
    console.log("PRINTING CATEGORY here ID: ", categoryId);
    // console.log("PRINTING BODY ID: ", req);
    // Get courses for the specified category
    const newcategoryId = new mongoose.Types.ObjectId(categoryId);
    const selectedCategory = await Category.findById(newcategoryId)
      .populate({
        path: "course",
        match: { status: "Published" },
        populate: "ratingandreviws",
        populate: {
            path: "instructor",
        },
      })
      .exec()

    //console.log("SELECTED COURSE", selectedCategory)
    // Handle the case when the category is not found
    if (!selectedCategory) {
      console.log("Category not found.")
      return res
        .status(404)
        .json({ success: false, message: "Category not found" })
    }
    // Handle the case when there are no courses
    console.log("SELECTED category = ", selectedCategory)
    if (selectedCategory.course.length === 0) {
      console.log("No courses found for the selected category.")
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      })
    }

    // Get courses for other categories
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: newcategoryId },
    })
    .populate({
      path: "course",
      match: { status: "Published" },
      populate: {
          path: "instructor",
      },
    })
    .exec();

    console.log("EXCEPTED CATEGORYIES = ",categoriesExceptSelected[2]._id);

    // Function to get a random integer between min (inclusive) and max (exclusive)
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min) + min);
    }
    
    // let differentCategory = await Category.findOne(
    //   categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id
    // )
    //   .populate({
    //     path: "courses",
    //     match: { status: "Published" },
    //   })
    //   .exec()
    let differentCategory = null;

    if (categoriesExceptSelected.length > 0) {
      const randomIndex = getRandomInt(0, categoriesExceptSelected.length);
      console.log("RANDOM INDEX = ",randomIndex);
      const selectedCategory = categoriesExceptSelected[randomIndex];
      console.log("SELECTED CATEGORIES EXCEPT = ",selectedCategory);

      if (selectedCategory && selectedCategory._id) {
        differentCategory = await Category.findOne(selectedCategory._id)
          .populate({
            path: "course",
            match: { status: "Published" },
            populate: {
                path: "instructor",
            },
          })
          .exec();
      }
    }

    console.log("SELECTED CATEGORY = ",selectedCategory)

    // Now you can use differentCategory
    console.log("Different Category = ", differentCategory);
      //console.log("Different COURSE", differentCategory)
    // Get top-selling courses across all categories
    const allCategories = await Category.find()
      .populate({
        path: "course",
        match: { status: "Published" },
        populate: {
          path: "instructor",
      },
      })
      .exec()
    const allCourses = allCategories.flatMap((category) => category.courses)
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10)
     // console.log("mostSellingCourses COURSE", mostSellingCourses)
    res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses,
      },
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

