  //                           TO DO
  //       - finish setting up newsletter signup api(app.post(/newsletter...))
  //       - SIGN UP / LOG IN funcitonalities/pages
  ////     - js hint for version 6 on top of app.js
  ////     - convert website to updated structure (HOMEPAGE + footer + header + SIGNUP / LOG IN  + DASHBOARD & FUCNTIONALITIES for  3 DIFFERENT USERS - Teacher / Student / Enterprise)
  ////     - apply app.route structure to api

  //SERVER CODE
  /// dotenv package for creating environmental vairables for encryption
  require('dotenv').config()
  const express = require("express");
  const bodyParser = require("body-parser");
  const request = require("request");
  const https = require("https");
  const mongoose = require("mongoose");
  //passport authentication, registering, encription and salting, session and cookies
  const session = require('express-session');
  const passport = require("passport");
  const passportLocalMongoose = require("passport-local-mongoose");
  const GoogleStrategy = require('passport-google-oauth20').Strategy;



  const app = express();

  app.set("view engine", "ejs");
  app.use(express.static("public"));
  app.use(bodyParser.urlencoded({ extended: true }));


  app.use(session({
    //any long string
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  // CONNECTION W/ MongoDB
  // mongoose.connect("mongodb://localhost:27017/wikiDB", { useNewUrlParser: true });
  // connection with server Atlas mongoDB
    mongoose.connect("mongodb+srv://username:password@cluster0.c1yqo.mongodb.net/lengoDB");

  // mongoose schema
  const userSchema = new mongoose.Schema({
    //fields
    email: String,
    password: String
  });

  userSchema.plugin(passportLocalMongoose);
  //mongoose model
  const User = new mongoose.model("User", userSchema);

  passport.use(User.createStrategy());
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  passport.use(new GoogleStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/google/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  ));

  //API
  app.get("/", function(req, res) {
    res.render("home", {});
  });

  app.get("/login", function(req, res) {
    res.render("login", {});
  });

  app.get("/register", function(req, res) {
    res.render("register", {});
  });

  app.get("/contact", function(req, res) {
    res.render("contact", {});
  });

  app.get("/newsletter", function(req, res) {
    res.render("newsletter", {});
  });

  app.get("/secrets", function(req, res) {
    if(req.isAuthenticated()) {
      res.render("secrets");
    } else {
      res.redirect("/login");
    }
  });

  app.get("/logout", function(req, res) {
    //passport method for logging route
    req.logout();
    res.redirect("/");
  });

  app.post("/register", function(req, res) {
    //this is level 5 security with passport.js
    //use passportLocalMongoose to handle user registration
    //this package also salts and hashs the password
    User.register({ username: req.body.username }, req.body.password, function(err, user) {
      if(err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets");
        });
      }
    });
  });

  app.post("/login", function(req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
    req.login(user, function(err) {
      if(err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets");
        });
      }
    });
  });

  // this is the post route from the signup page...
  app.post("/newsletter", function(req, res) {
    var firstName = req.body.fName;
    var lastName = req.body.lName;
    var email = req.body.email;
    // fetching mailchimp style Data, read mailchimp docs for add member to list
    var data = {
      members: [{
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName
        }
      }]
    };

    const jsonData = JSON.stringify(data);

    const url = "https://us1.api.mailchimp.com/3.0/lists/34be7a3b2c";

    const options = {
      method: "POST",
      //authentication as per mailchimp specifications and node.js http.request(url[, options][, callback])
      auth: "ricardo1:77082a3295a26e727aac634dfe513873-us1"
    }

    // the requesrt must be stored as a constant
    const request = https.request(url, options, function(response) {

      if(response.statusCode === 200) {
        res.sendFile(__dirname + "/success.html");
      } else {
        res.sendFile(__dirname + "/failure.html");
      };

      response.on("data", function(data) {
        console.log(JSON.parse(data));
      })
    })

    request.write(jsonData);
    request.end();

  });

  // this is the post route from the failure page...
  app.post("/failure", function(req, res) {
    res.redirect("/");
  });

  let port = process.env.PORT;
  if(port == null || port == "") { port = 4000; }
  app.listen(port, function() { console.log("Server started successfully"); });
