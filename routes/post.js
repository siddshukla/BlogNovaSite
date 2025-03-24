const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Post = require("../models/post.js");
const { isLoggedIn, isOwner, validatePost } = require("../middleware.js");

// Index Route - Show all posts
router.get(
  "/",
  wrapAsync(async (req, res) => {
    const allPosts = await Post.find({});
    res.render("posts/index.ejs", { allPosts });
  })
);

// New Route - Show form to create new post
router.get("/new", isLoggedIn, (req, res) => {
  res.render("posts/new.ejs");
});

// Show Route - Show details of a specific post
router.get(
  "/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id).populate({path: "reviews", populate:{path: "author"}}).populate("owner");

    if (!post) {
      req.flash("error", "Post Not Found");
      return res.redirect("/posts");
    }

    res.render("posts/show.ejs", { post });
  })
);

// Create Route - Add new post to database
router.post(
  "/",
  isLoggedIn,
  validatePost,
  wrapAsync(async (req, res) => {
    const newPost = new Post(req.body.post);
    newPost.owner = req.user._id;
    await newPost.save();
    req.flash("success", "New Post Added!");
    res.redirect("/posts");
  })
);

// Edit Route - Show edit form for a post
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      req.flash("error", "Post Not Found");
      return res.redirect("/posts");
    }

    res.render("posts/edit.ejs", { post });
  })
);

// Update Route - Handle post update
router.put(
  "/:id",
  isLoggedIn,
  isOwner,
  validatePost,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      req.flash("error", "Post Not Found");
      return res.redirect("/posts");
    }

    await Post.findByIdAndUpdate(id, { ...req.body.post });
    req.flash("success", "Post Updated!");
    res.redirect(`/posts/${id}`);
  })
);

// Delete Route - Delete a post
router.delete(
  "/:id",
  isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      req.flash("error", "Post Not Found");
      return res.redirect("/posts");
    }

    await Post.findByIdAndDelete(id);
    req.flash("success", "Post Deleted!");
    res.redirect("/posts");
  })
);

module.exports = router;
