// const {instance}  = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const {mailSender} = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const mongoose = require("mongoose");
const {paymentEmailsuccessful} = require("../mail/templates/paymentEmailsuccessful");
const {instance} = require('../config/razorpay');
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");


module.exports.capturePayment = async(req,res)=>{
  try {
    // console.log("REAQUEST = ",req);
    const {courses} = req.body;
    const userId = req.user.Id;

    if(courses.length === 0){
      return res.json({
        success: false,
        message: "Please Provide course Id"
      });
    }

    let totalAmount = 0;
    for(const course_id of courses){
      let course ;
      try {
        
        course = await Course.findById(course_id);
        if(!course){
          return res.status(200).json({
            success: false, message: "Course not found"
          });
        }

        const uid = new mongoose.Types.ObjectId(userId);
        if(course.studentenrolled.includes(userId)){
          return res.status(200).json({
            success: false,
            message: "You are already enrolled in this course"
          
          });
        }
        totalAmount += course.price;
      } catch (error) {
        console.log(error)
        return res.status(500).json({
          success: false,
          message: "Internal Server Error Part 1 of capturePayment"
        })
      }
    }

    const options = {
      amount: totalAmount * 100,
      currency: "INR",
      receipt: Math.random(Date.now()).toString(),
    }

    try {
      // console.log("INSTANCE = ",instance);
      const paymentResponse = await instance.orders.create(options);
      return res.json({
        success: true,
        message: "Order create successfully",
        data: paymentResponse
      })
      
    } catch (error) {
      console.log("Internal Server Error Part 2",error)
      return res.status(500).json({
        success: false,
        message: "Internal Server Error Part 2"
      })
    }
    
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: "Internal Server Error Part 3"
    })
  }
}
//verify signature
module.exports.verifySignature =async(req,res)=>{
  try {

    // console.log("RAZORPAY VERIFYSIGNATURE BODY = ",req.body);
    const razorpay_order_id = req.body?.razorpay_order_id
    const razorpay_payment_id = req.body?.razorpay_payment_id
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses; 
    const userId = req.user.id;

    if(
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !courses ||
      !userId
      ){
      return res.status(400).json({
        success: false,
        message: "Please provide all the required parameters"
      })
      }
    
    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const exceptedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

    if(exceptedSignature === razorpay_signature){
      // enroll kara do student enrolled courses
      await enrolledStudents(courses , userId , res);
      //return res
      return res.status(200).json({
        success: true,
        message: "Payment Successful"
      })
    }

    return res.status(200).json({
      success: false,
      message: "Invalid Signature",
    })
    
  } catch (error) {
    console.log(error)
     return res.status(500).json({
       success: false,
       message: "Internal Server Error verifySignature"
     })
  }
}

const enrolledStudents = async(courses , userId , res)=>{
  
  if(!courses || !userId){
    return res.status(400).json({
      success: false,
      message: "Please provide all the required parameters for userId"
    })
  }

  for(const course_id of courses){
   try {
     // enroll student in courses
     const enrolledCourse = await Course.findOneAndUpdate(
       {_id:course_id},
       {$push:{studentenrolled:userId}},
       {new: true}
     )

     if(!enrolledCourse){
       return res.status(400).json({
         success: false,
         message: "Course not found"
       })
     }

     const courseProgres = await CourseProgress.create({
       courseID: course_id,
       userID: userId,
       completevideos:[],
     })

     //find the student and add the student in the enrolled courses
     const enrolledStudent = await User.findOneAndUpdate(
       {_id: userId},
       {$push:{
         courses:course_id,
         courseProgress:courseProgres._id
       }},
       {new: true}
     )

     //send the email to the student
     const emailResponse = await mailSender(
       enrolledStudent.email,
       `Successfully Enrolled in the course ${enrolledCourse.courseName}`,
       courseEnrollmentEmail(
         enrolledCourse.courseName,
       `${enrolledStudent.firstName} ${enrolledStudent.lastName} `)
     )

     console.log("EMAIL SEND SUCCESSFULLY RESPONSE = ",emailResponse.response);
   } catch (error) {
     console.log(error)
     return res.status(500).json({
       success: false,
       message: "Internal Server Error enrolledStudents"
     })
   }
  }
  
}

module.exports.sendPaymentsuccesfulEmail = async(req,res)=>{
  try {

    console.log(" SEND PAYEMENT SUCCESSFULL = ",req.body);
    const {orderId , paymentId, amount }= req.body;

    const userId = req.user.id;

    if(!orderId || !paymentId || !amount || !userId){
      return res.status(400).json({
        success: false,
        message: "Please provide all the fields"
      })
    }

    try {
      // fin dthe student
      const enrolledStudent = await User.findOne({_id:userId});
      await mailSender(
        enrolledStudent.email,
        `Payment Successful`,
        paymentEmailsuccessful(
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
                              amount/100 ,orderId , paymentId)
      )
    } catch (error) {
      console.log("ERROR IN SENDING EMAIL...",error);
      return res.status(500).json({
        success: false,
        message: "Email not send"
      })
    }
  } catch (error) {
    console.log("ERROR IN SENDING EMAIL1...",error);
    return res.status(500).json({
      success: false,
      message: "Email not send 1"
    })
  }
}

//cousre ka payment capture karna h
// module.exports.capturePayment = async(req,res)=>{
//   try {
    
//     const {course_id} = req.body;
//     const userId = req.user.id;
    
//     if(!course_id){
//       return res.json({
//         success: false,
//         message: "Please Provide a valide course Id "
//       })
//     };
//     let course;
//     try{
//       course = await Course.findById(course_id);
//       if(!course){
//         return res.json({
//           success: false,
//           message: "could not find the course details "
//         });
//       };

//       //user already pay for the same course;
//       const uid = new mongoose.Types.ObjectId(userId);

//       if(course.studentenrolled.includes(uid)){
//         return res.status(200).json({
//           success: false,
//           message: "Student is alredy pay for this Course",
//         })
//       }
//     }
//     catch(error){
//       console.error(error);
//       return res.status(500).json({
//         success: false,
//         message: "Cloud not find the course Details" 
//       })
//     }
    
//     //order created 
//     const amount = course.price;
//     const currency = "INR";
//     const options = {
//       amount: amount * 100,
//       currency,
//       receipt: Math.random(Date.now()).toString(),
//       notes:{
//         courseId : course_id,
//         userId : userId
//       }
//     };

//     //function called for the order placed try and catched

//     try {
//       const paymentResponse = await instance.orders.create(options);
//       console.log(paymentResponse);
//       //return the response;
//       return res.status(200).json({
//         success: true,
//         courseName:course.courseName,
//         courseDescription: course.courseDescription,
//         thumbnail: course.thumbnail,
//         orderId: paymentResponse.id,
//         currency: paymentResponse.currency,
//         amount: paymentResponse.amount,
//       });
//     } catch (error) {
//       console.log(error);
//       return res.status(500).json({
//         success: false,
//         message: "Cloud not iniziates the order" 
//       })
//     }
    
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       success: false,
//       message: "Error in the order" 
//     })
//   }
// }

// //verify the signature of the razorpay
// module.exports.verifySignature =  async(req,res)=>{
//   try {
//     const webhookSecret = "1234566789";
//     const signature = req.headers["x-razorpay-signature"];

//     const shasum = crypto.createHmac("sha256", webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");

//     if(signature === digest){
//       console.log("Payment is Authorised");

//       const {courseId,userId} = req.body.payload.payment.entity.notes;

//       try {
//         // fullfilled actions
//         // find the course and enrolled the students in it
//         const courseEnrolled = await Course.findOneAndUpdate(
//           {_id: courseId},
//           {$push: {studentenrolled: userId}},
//           {new: true},
//         );
        
//         if(!courseEnrolled){
//           return res.status(500).json({
//             success: false,
//             message: "course is not found", 
//           })
//         }

//         console.log(courseEnrolled);
//         //upadte the user to enrolled in course
//         const user = await User.findOneAndUpdate(
//           {_id:userId},
//           {$push:{courses: courseId}},
//           {new: true},
//         )

//         console.log(user);
//          //send the email of course updation
//         const emailRespoanse = await mailsender(
//           user.email,
//           "Congratualation",
//           `You are enrolled in the course : Rahulpal`
//         )
//         console.log(emailRespoanse);
//         return res.status(200).json({
//           success: true,
//           message : "You Have Enrolled in the Course",
//         })
//       } 
//       catch (error) {
//         console.log(error);
//         return res.status(500).json({
//           success: false,
//           message: "Error in the Course and students updation" 
//         })
//       }
      
//     }

//     else{
//       console.log("Payment is Not Authorised");
//       return res.status(500).json({
//         success: false,
//         message: "Invalid Request",
//       })
//     }
    
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       success: false,
//       message: "Error in the signature" 
//     })
//   }
// }
