const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const dotenv = require("dotenv");
const passportLocalMongoose = require("passport-local-mongoose");

// Load environment variables from .env file
dotenv.config();

// Use MongoDB Atlas URL from environment variables with fallback to local database
const MONGO_URL = process.env.MONGO_URL;

// Configure Express
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Session Configuration - FIXED: Removed fixed expires property
const sessionOptions = {
  secret: process.env.SESSION_SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

// Setup session before using it in routes
app.use(session(sessionOptions));
app.use(flash());

// Define utility functions
class ExpressError extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}

const wrapAsync = function (fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((err) => next(err));
  };
};

// Define schemas with Joi (assumed to be in schema.js)
const Joi = require('joi');

const postSchema = Joi.object({
  post: Joi.object({
    name: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    image: Joi.string().allow(""),
  }).required(),
});

const reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required(),
  }).required(),
});

// MongoDB Models
// Review Model
const reviewSchema_mongo = new mongoose.Schema({
  comment: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // FIXED: Changed from "Post" to "User"
  },
});

const Review = mongoose.model("Review", reviewSchema_mongo);

// User Model
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  }
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

// Post Model
const postSchema_mongo = new mongoose.Schema({
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// Middleware for post deletion
postSchema_mongo.post("findOneAndDelete", async function (doc) {
  if (doc && doc.reviews.length > 0) {
    await Review.deleteMany({ _id: { $in: doc.reviews } });
  }
});

const Post = mongoose.model("Post", postSchema_mongo);

// Connect to Database
async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to Database");
}

main().catch((err) => {
  console.log(err);
});

// Passport configuration - INITIALIZE BEFORE CONFIGURING STRATEGIES
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware for auth and validation
app.use((req, res, next) => {
  res.locals.currUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be signed in");
    return res.redirect("/login");
  }
  next();
};

// ADDED: New middleware to check ownership
const isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const post = await Post.findById(id);
  
  if (!post) {
    req.flash("error", "Post not found");
    return res.redirect("/posts");
  }
  
  if (!post.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that");
    return res.redirect(`/posts/${id}`);
  }
  next();
};

const saveRedirectUrl = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.redirectUrl = req.session.returnTo;
    delete req.session.returnTo;
  }
  next();
};

const validatePost = (req, res, next) => {
  const { error } = postSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

// ROUTES

// Home Routes
app.get("/", (req, res) => {
  res.render("posts/home.ejs", { currUser: req.user });
});

app.get("/about", (req, res) => {
  res.render("about.ejs");
});

app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

// User Routes
app.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

app.post(
  "/signup",
  wrapAsync(async (req, res, next) => {
    try {
      let { username, email, password } = req.body;
      
      // Check if username already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        req.flash("error", "Username already exists");
        return res.redirect("/signup");
      }
      
      // Check if email already exists (optional)
      if (email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          req.flash("error", "Email already in use");
          return res.redirect("/signup");
        }
      }
      
      const newUser = new User({ email, username });
      const registeredUser = await User.register(newUser, password);

      req.login(registeredUser, (err) => {
        if (err) {
          return next(err);
        }
        req.flash("success", "Welcome to BlogNova!");
        res.redirect("/posts");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  })
);

app.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

app.post(
  "/login", 
  saveRedirectUrl,
  passport.authenticate("local", { 
    failureRedirect: "/login", 
    failureFlash: true 
  }),
  (req, res) => {
    req.flash("success", "Welcome back to BlogNova!");
    let redirectUrl = res.locals.redirectUrl || "/posts";
    res.redirect(redirectUrl);
  }
);

app.get("/logout", (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You are logged out now");
    res.redirect("/");
  });
});

// Post Routes
app.get(
  "/posts",
  wrapAsync(async (req, res) => {
    const allPosts = await Post.find({});
    res.render("posts/index.ejs", { allPosts });
  })
);

app.get("/posts/new", isLoggedIn, (req, res) => {
  res.render("posts/new.ejs");
});

app.get(
  "/posts/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const post = await Post.findById(id)
      .populate("reviews")
      .populate("owner")
      .populate({
        path: "reviews",
        populate: {
          path: "author",
          model: "User"
        }
      });

    if (!post) {
      throw new ExpressError(404, "Post Not Found");
    }

    res.render("posts/show.ejs", { post });
  })
);

app.post(
  "/posts",
  isLoggedIn,
  validatePost,
  wrapAsync(async (req, res, next) => {
    const newPost = new Post(req.body.post);
    newPost.owner = req.user._id;
    await newPost.save();
    req.flash("success", "New Post Added");
    res.redirect("/posts");
  })
);

app.get("/privacy-policy", (req, res) => {
  res.render("privacy.ejs");
});

app.get(
  "/posts/:id/edit",
  isLoggedIn,
  isAuthor, // ADDED: ownership check
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      throw new ExpressError(404, "Post Not Found");
    }
    res.render("posts/edit.ejs", { post });
  })
);

app.put(
  "/posts/:id",
  isLoggedIn,
  isAuthor, // ADDED: ownership check
  validatePost,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const post = await Post.findByIdAndUpdate(
      id,
      { ...req.body.post },
      { new: true }
    );
    if (!post) {
      throw new ExpressError(404, "Post Not Found");
    }
    req.flash("success", "Post updated successfully");
    res.redirect(`/posts/${id}`);
  })
);

app.delete(
  "/posts/:id",
  isLoggedIn,
  isAuthor, // ADDED: ownership check
  wrapAsync(async (req, res) => {
    let { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      throw new ExpressError(404, "Post Not Found");
    }

    // Use findByIdAndDelete which will trigger the middleware
    await Post.findByIdAndDelete(id);
    req.flash("success", "Post deleted successfully");
    res.redirect("/posts");
  })
);

// Review Routes
app.post(
  "/posts/:id/reviews",
  isLoggedIn, // ADDED: require login for reviews
  validateReview,
  wrapAsync(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
      throw new ExpressError(404, "Post Not Found");
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id; // FIXED: Set author to current user instead of post
    
    await newReview.save();
    post.reviews.push(newReview._id);
    await post.save();
    
    req.flash("success", "Review added successfully");
    res.redirect(`/posts/${post._id}`);
  })
);

// ADDED: Middleware to check review ownership
const isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);
  
  if (!review) {
    req.flash("error", "Review not found");
    return res.redirect(`/posts/${id}`);
  }
  
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that");
    return res.redirect(`/posts/${id}`);
  }
  next();
};

app.delete(
  "/posts/:id/reviews/:reviewId",
  isLoggedIn,
  isReviewAuthor, // ADDED: Check review ownership
  wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;

    await Post.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    
    req.flash("success", "Review deleted successfully");
    res.redirect(`/posts/${id}`);
  })
);

// Error handling
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  console.error(err); // Add proper error logging
  let { statusCode = 500, message = "Something Went Wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// Use PORT from environment variables with fallback to 8000
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});