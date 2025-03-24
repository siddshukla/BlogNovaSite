const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl } = require("../middleware.js");

router.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

router.post(
  "/signup",
  wrapAsync(async (req, res, next) => {
    try {
      let { username, email, password } = req.body;
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


router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

router.post(
  "/login",saveRedirectUrl,
  passport.authenticate("local", { failureRedirect: "/login" , failureFlash: true,}),
  async (req, res) => {
    req.flash("success", "Welcome back to BlogNova!");
    let redirectUrl = res.locals.redirectUrl || "/posts";
    res.redirect(redirectUrl);
  }
);

router.get("/logout", (req,res,next)=>{
  req.logOut((err)=>{
    if(err){
      NextPlan(err);
    }
    req.flash("success", "You are logged out now");
    res.redirect("/");
  })
})

module.exports = router;
