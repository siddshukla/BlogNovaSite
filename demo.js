const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Use environment variable with fallback
const MONGO_URL = process.env.MONGO_URL;

// ===== SCHEMA DEFINITIONS =====
// Define Joi schema for validation
const { postSchema, reviewSchema } = require("./schema.js"); // Note: This file still needs to be separate

// ===== ERROR HANDLING UTILITIES =====
// ExpressError class definition
class ExpressError extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}

// Async error wrapper
function wrapAsync(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((err) => next(err));
  };
}

// ===== MODEL DEFINITIONS =====
// User Schema and Model
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  }
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

// Review Schema and Model
const reviewSchema2 = new mongoose.Schema({
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
    ref: "User",
  },
});

const Review = mongoose.model("Review", reviewSchema2);

// Post Schema and Model
const postSchema2 = new mongoose.Schema({
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

// Fixed middleware to ensure Review model is available
postSchema2.post("findOneAndDelete", async function (doc) {
  if (doc && doc.reviews.length > 0) {
    await Review.deleteMany({ _id: { $in: doc.reviews } });
  }
});

const Post = mongoose.model("Post", postSchema2);

// ===== MIDDLEWARE FUNCTIONS =====
// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in first!");
    return res.redirect("/login");
  }
  next();
};

// Middleware to save redirect URL for after login
const saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

// Middleware to check if user is the owner of the post
const isOwner = async (req, res, next) => {
  const { id } = req.params;
  const post = await Post.findById(id);

  if (!post) {
    req.flash("error", "Post not found");
    return res.redirect("/posts");
  }

  if (!req.user || !post.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to do that!");
    return res.redirect(`/posts/${id}`);
  }

  next();
};

// Middleware to validate post data using Joi
const validatePost = (req, res, next) => {
  const { error } = postSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errMsg);
  }
  next();
};

// Middleware to validate review data using Joi
const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

// Middleware to check if user is the author of the review
const isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId); // Fixed variable name (was "reviews")
  if (!review.author.equals(req.user._id)) { // Fixed to use req.user instead of res.locals.currUser
    req.flash("error", "You are not the author of this review");
    return res.redirect(`/posts/${id}`);
  }
  next();
};

// ===== DATABASE CONNECTION =====
main()
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

// ===== APP CONFIGURATION =====
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

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

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Configure passport local strategy with error handling
passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Invalid username or password" });
      }

      user.authenticate(password, function (err, user, passwordErr) {
        if (err) {
          return done(err);
        }

        if (passwordErr) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, user);
      });
    } catch (err) {
      return done(err);
    }
  })
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash middleware
app.use((req, res, next) => {
  res.locals.currUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ===== ROUTES =====
// Home route
app.get("/", (req, res) => {
  res.render("posts/home.ejs", { currUser: req.user });
});

// About route
app.get("/about", (req, res) => {
  res.render("about.ejs");
});

// Contact route
app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

// ===== USER ROUTES =====
// Route to display signup form
app.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

// Signup route with existing username check
app.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
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
    
    // Create new user
    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);
    
    // Login after successful registration
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to BlogNova!");
      res.redirect("/posts");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
});

// Login route - display form
app.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

// Login route - handle form submission
app.post("/login", saveRedirectUrl, function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }

    if (!user) {
      req.flash("error", "Invalid username or password");
      return res.redirect("/login");
    }

    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }

      req.flash("success", "Welcome back to BlogNova!");
      let redirectUrl = res.locals.redirectUrl || "/posts";
      return res.redirect(redirectUrl);
    });
  })(req, res, next);
});

// Logout route
app.get("/logout", (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err); // Fixed from NextPlan(err) to next(err)
    }
    req.flash("success", "You are logged out now");
    res.redirect("/");
  });
});

// ===== POST ROUTES =====
// Index Route - Show all posts
app.get(
  "/posts",
  wrapAsync(async (req, res) => {
    const allPosts = await Post.find({});
    res.render("posts/index.ejs", { allPosts });
  })
);

// New Route - Show form to create new post
app.get("/posts/new", isLoggedIn, (req, res) => {
  res.render("posts/new.ejs");
});

// Show Route - Show details of a specific post
app.get(
  "/posts/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate({path: "reviews", populate:{path: "author"}})
      .populate("owner");

    if (!post) {
      req.flash("error", "Post Not Found");
      return res.redirect("/posts");
    }

    res.render("posts/show.ejs", { post });
  })
);

// Create Route - Add new post to database
app.post(
  "/posts",
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

app.get("/privacy-policy", (req, res) => {
  res.render("privacy.ejs");
});

// Edit Route - Show edit form for a post
app.get(
  "/posts/:id/edit",
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
app.put(
  "/posts/:id",
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
app.delete(
  "/posts/:id",
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

// ===== REVIEW ROUTES =====
// Review post route
app.post(
  "/posts/:id/reviews",
  isLoggedIn,
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
app.delete(
  "/posts/:id/reviews/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;

    await Post.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    
    req.flash("success", "Review Deleted!");
    res.redirect(`/posts/${id}`);
  })
);

// ===== ERROR HANDLING =====
// Page not found handler
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err); // Add proper error logging
  let { statusCode = 500, message = "Something Went Wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});

module.exports = { app, Post, Review, User }; // Export for testing or external use