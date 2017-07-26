// REQUIRING NECESSARY NODE MODULES
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const cp = require("cookie-parser");
const session = require("express-session");
const Passport = require("./passport.js");

const mongoose = require("mongoose");

const User = require("./models/users.js");
const Chatter = require("./models/chatters");
const Group = require("./models/groups");
const Chat = require("./models/chats");


// Create the Express App
const app = express();

// Connect to MongoDB Database
mongoose.connect("mongodb://localhost:27017/chitchat", {
    useMongoClient: true
});


// Set EJS as View Engine
app.set("view engine", "ejs")


//====================
//    MIDDLEWARES
//====================

app.use(cp('Secret Key'));
app.use(session({
    secret: 'Secret Key',
    resave: false,
    saveUninitialized: true
}));


// Use Body Parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


// Initialize Passport
app.use(Passport.initialize());
app.use(Passport.session());


//====================
//       ROUTES
//====================

// Post Request to '/' for SIGNUP
app.post('/', function (req, res, next) {
    // TODO: Add UserName Validation for same Users
    // Create a New User with entered details
    User.create({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        name: req.body.firstName + " " + req.body.lastName
    });
    Chatter.create({
        username: req.body.username,
        chats: []
    });
    // Redirect Page back to Landing Page
    res.redirect('/');
});

// Post Request to '/login' for logging in
app.post('/login', Passport.authenticate('local', {
    failureRedirect: '/',   // Redirect to Home Page if Authentication Fails
    successRedirect: '/chats' // Redirect to User's Profile Page if Authentication Succeeds
}));

// Get Request for the Profile Page
app.get('/chats', function (req, res) {
    // Find the current Chatter in chatters collection
    Chatter.findOne({
        username: req.user.username
    }).populate("chat").exec(function (err, chatter) {    // Populate the chats in the chatters collection
        if (err) throw err;
        // Find current User
        User.findAll({
            where: {
                username: chatter.username
            }
        }).then(function (users) {
            // Render chats.ejs with Current User's Name, current Chatter
            res.render("chats", {
                chatter: chatter,
                name: users[0].name
            });
        });
    });
});


app.get("/chat", function (req, res) {
    // Find the current Chatter in chatters collection
    Chatter.findOne({
        username: req.user.username
    }).populate("chat").exec(function (err, chatter) {    // Populate the chats in the chatters collection
        if (err) throw err;
        // Find current User
        User.findAll({
            where: {
                username: chatter.username
            }
        }).then(function (users) {
            // Render chats.ejs with Current User's Name, current Chatter
            res.render("chat", {
                chatter: chatter,
                name: users[0].name
            });
        });
    });
});

app.get("/chats/:chatId", function (req, res) {
    Chatter.findOne({
        username: req.user.username
    }).populate("chat").exec(function (err, chatter) {
        if (err) throw err;

        User.findAll({
            where: {
                username: chatter.username
            }
        }).then(function (users) {
            for (chat of chatter.chats) {
                if (chat._id == req.params.chatId) {
                    console.log("Chat found");
                    res.render("chat", {
                        chatter,
                        name:users[0].name,
                        title: chat.to
                    });
                }
            }
        });
    })
});


// MOUNTING STATIC FILES
app.use('/', function (req, res, next) {
    express.static(path.join(__dirname, "public_static"))(req, res, next);
});


// Listen at 3000
app.listen(3000, function () {
    console.log("Server Started");
});