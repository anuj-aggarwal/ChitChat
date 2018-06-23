// Crypto
const crypto = require("crypto");

const route = require("express").Router();

// Databases
const { User, Bot } = require("../models");
const { checkLoggedIn } = require("../utils/auth");


//====================
//       ROUTES
//====================

// GET Route for New Bot Page
route.get("/new", checkLoggedIn, (req, res) => {
    // Render new Bot Page
    res.render("bot/new", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});


// Post Request for Creating New Bot
route.post("/", checkLoggedIn, async (req, res) => {
    try {
        // Check if Bot Name is Already present
        const bot = await Bot.findByUsername(req.body.botName);

        // If Bot is already present
        if (bot !== null) {
            req.flash("error", `Bot ${req.body.botName} already exists!`);
            return res.redirect("/bots/new");
        }

        // Check a User with same username
        const user = await User.findByUsername(req.body.botName);
        if (user !== null) {
            req.flash("error", `User with username ${req.body.botName} already exists!`);
            return res.redirect("/bots/new");
        }

        // If Bot is not Present
        // Create the New Bot
        const newBot = await Bot.create({
            username: req.body.botName,
            secret: (await crypto.randomBytes(16)).toString("hex"),
            chats: []
        });

        // Add Bot to user's Bots
        req.user.bots.push(newBot);
        await req.user.save();

        // Flash the Username and Secret of Bot
        req.flash("success", `Bot successfully created! Username: ${newBot.username} Secret: ${newBot.secret}`);
        // Redirect User to All Bots Page
        res.redirect(`/chats`);

    } catch (err) {
        console.error(err.stack);
        return res.sendStatus(500);
    }
});

// GET Route for All Bots Page
route.get("/", checkLoggedIn, async (req, res) => {
    try {
        // Find all Bots
        await req.user.populate("bots").execPopulate();

        // Render All Bots Page
        res.render("bot");

    } catch (err) {
        console.error(err.stack);
        return res.sendStatus(500);
    }
});


// Export current Route
module.exports = route;