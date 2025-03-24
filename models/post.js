const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Import Review model - this was missing in your code
const Review = require("./review");

const postSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default:
      "https://www.shutterstock.com/shutterstock/videos/1106757365/thumb/8.jpg?ip=x480",
    set: (v) => {
      return v === ""
        ? "https://www.shutterstock.com/shutterstock/videos/1106757365/thumb/8.jpg?ip=x480"
        : v;
    },
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

// Fixed middleware to ensure Review model is available
postSchema.post("findOneAndDelete", async function (doc) {
  if (doc && doc.reviews.length > 0) {
    await Review.deleteMany({ _id: { $in: doc.reviews } });
  }
});

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
