const mongoose = require("mongoose");

const catrgorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description:{
    type: String
  },
  course:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  }]
})

// module.exports = mongoose.model("Category",catrgorySchema);
const Category = mongoose.model('Category', catrgorySchema);

module.exports = Category;