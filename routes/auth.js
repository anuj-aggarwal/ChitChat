// File System
const fs = require("fs");
// Bcrypt
const bcrypt = require("bcrypt");
// Cloudinary
const { upload, cloudinary } = require("../utils/images");

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

// POST Route to Upload Profile Image
route.post("/image", checkLoggedIn, upload.single("image"), async (req, res) => {
    try {
        // If Image does not exist
        if (!req.file) {
            return res.status(400).send("Unable to Upload File!");
        }
        // Upload Image to Cloudinary
        const { url, public_id } = await cloudinary.uploader.upload(req.file.path);

        const { imageId: oldId } = req.user;

        // Update User Model with new URL
        req.user.imageUrl = url;
        req.user.imageId = public_id;
        await req.user.save();
        
        res.send({ url });

        // Delete old image from cloudinary
        if (oldId) {
            cloudinary.uploader.destroy(oldId)
                .catch(err => {
                    console.error(`Error in removing old image: ${oldId}`, err.stack);
                });
        }
        // Remove Temporary image from File System
        fs.unlink(req.file.path, err => {
            if (err)
                console.error(`Error in removing Image from file system: ${req.file.path}`, err.stack);
        });

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});


// Export current Route
module.exports = route;