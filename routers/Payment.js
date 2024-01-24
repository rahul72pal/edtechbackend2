const express = require("express")
const router = express.Router()

const {capturePayment , 
       verifySignature,
       sendPaymentsuccesfulEmail
      } = require("../controllers/Payments");

const {auth , isInstructor , isStudent, isAdmin} = require("../middlewares/auth");

router.post("/capturePayment", auth , isStudent, capturePayment)
router.post("/verifyingSignature",auth , isStudent, verifySignature);
router.post("/sendPaymentSuccessEmail",auth , isStudent, sendPaymentsuccesfulEmail);

module.exports = router