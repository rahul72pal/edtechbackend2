const Category = require("../models/Category");

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
    const tagdetails = await Tags.create({
      name,
      description
    });
    
    console.log(tagdetails);

    return res.status(200).json({
      success: true,
      message: "Tag created successfully",
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

    const alltags = await Tags.find({},{name:true, description:true,});
    
    return res.status(200).json({
      success: true,
      message: "All tags are required",
      alltags
    });
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
};