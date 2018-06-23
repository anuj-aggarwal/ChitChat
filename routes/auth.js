// Bcrypt
const bcrypt = require("bcrypt");

const route = require("express").Router();
const Passport = require("passport");

// Databases
const { User, Bot } = require("../models");
const { checkLoggedIn } = require("../utils/auth");


//====================
//       ROUTES
//====================

// Post Request to '/' for SIGNUP
route.post("/signup", async (req, res, next) => {
    try {
        // Find if Username already taken
        let user = await User.findByUsername(req.body.username);

        // If username exists already
        if (user !== null) {
            req.flash("error", `Username ${req.body.username} already in use!`);
            return res.redirect("/");
        }

        // Find Bot with the username
        const bot = await Bot.findByUsername(req.body.username);
        if (bot !== null) {
            req.flash("error", `Username ${req.body.username} already in use!`);
            return res.redirect("/");
        }

        // Username does not exists
        // Generate Hashed Password
        const hash = await bcrypt.hash(req.body.password, 5);

        // Create a New User with entered details, Hashed Password and other defaults
        user = await User.create({
            username: req.body.username,
            password: hash,
            name: req.body.firstName + " " + req.body.lastName,
            email: req.body.email,
            chats: [],
            groups: [],
            favouriteChannels: []
        });

        // Redirect User back to Landing page
        req.flash("success", "Successfully Signed Up!");

        // Login the current User
        Passport.authenticate("local", {
            successRedirect: "/chats",
            failureRedirect: "/"    // Not necessary, but for safety :)
        })(req, res, next);

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});

// Post Request to '/login' for logging in
route.post("/login", (req, res, next) => {
    Passport.authenticate("local", (err, user) => {
        if (err)
            return next(err);

        if (!user) {
            req.flash("error", "Invalid Credentials!");
            return res.redirect("/");
        }

        req.logIn(user, err => {
            if (err)
                return next(err);

            req.flash("success", `Welcome back ${user.username}!`);
            return res.redirect("/chats");
        });

    })(req, res, next);
});

// Get Request for Logging Out
route.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Thank you for using ChitChat.....!!");
    res.redirect("/");
});


// Export current Route
module.exports = route;