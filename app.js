// REQUIRING NECESSARY NODE MODULES
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cp = require("cookie-parser");
const session = require("express-session");

const Users = require("./models/users.js");
const Passport = require("./passport.js");

const app = express();

app.use(cp('somesecret'));
app.use(session({
    secret: 'somesecret',
    resave: false,
    saveUninitialized: true
}));


// Use Body Parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


// Initialize Passport
app.use(Passport.initialize());
app.use(Passport.session());



//==================
//      ROUTES
//==================

// Post Request to '/' for SIGNUP
app.post('/', function (req, res, next) {
    // TODO: Add UserName Validation for same Users
    // Create a New User with entered details
    Users.create({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        name: req.body.firstName + " " + req.body.lastName
    });
    // Redirect Page back to Landing Page
    res.redirect('/');
});

// Post Request to '/login' for logging in
app.post('/login', Passport.authenticate('local', {
    failureRedirect: '/',   // Redirect to Home Page if Authentication Fails
    successRedirect: '/profile' // Redirect to User's Profile Page if Authentication Succeeds
}));

// Get Request for the Profile Page
app.get('/profile', function (req, res) {
    res.send("Profile Page");
});

// MOUNTING STATIC FILES
app.use('/' , function(req, res, next){
    express.static(path.join(__dirname,"public_static"))(req, res, next);
});






// Listen at 3000
app.listen(3000, function () {
    console.log("Server Started");
});