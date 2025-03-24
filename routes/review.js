const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schema.js");
const Review = require("../models/review.js");
const Post = require("../models/post.js");
const { validateReview, isLoggedIn, isReviewAuthor} = require("../middleware.js");


// review post route
router.post(
  "/",isLoggedIn,
  validateReview,
  wrapAsync(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
      throw new ExpressError(404, "Post Not Found");
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    post.reviews.push(newReview._id);

    await newReview.save();
    await post.save();
    req.flash("success", "New Review Created");
    res.redirect(`/posts/${post._id}`);
  })
);

// Delete review route
router.delete(
  "/:reviewId",isLoggedIn,isReviewAuthor,
  wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;

    await Post.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/posts/${id}`);
  })
);

module.exports = router;
