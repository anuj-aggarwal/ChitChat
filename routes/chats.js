const route = require("express").Router();

// Databases
const { User, Chat } = require("../models");

// Utilities
const { checkLoggedIn } = require("../utils/auth");


//====================
//       ROUTES
//====================

// Get Request for the Profile Page, showing all Chats
route.get("/", checkLoggedIn, async (req, res) => {
    try {
        // Get all Chats of User: URL, Name and unreadMessages
        const userChats = req.user.chats.map(chat => ({
            name: chat.to,
            link: `/chats/${chat.chat}`,
            unreadMessages: chat.unreadMessages
        }));

        const user = await req.user.populate("groups").execPopulate();

        // Get all Groups of User: URL, Name and unreadMessages
        const groupChats = user.groups.map(group => ({
            name: group.name,
            link: `/groups/${group.id}`,
            unreadMessages: group.members.find(member => member.username === user.username).unreadMessages
        }));

        // Stores all Chat Names, Redirect URLs and Unread Messages
        const chats = [...userChats, ...groupChats];


        // Don't Cache this page to reload chats!
        res.set("Cache-Control", "no-store");

        // Render chats.ejs with chats
        res.render("chats", {
            chats,
            success: req.flash("success"),
            error: req.flash("error")
        });

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});

// Post Request to /chats to Add New Chat
route.post("/", checkLoggedIn, async (req, res) => {
    try {
        // Find User with entered Username
        const receiver = await User.findByUsername(req.body.username);

        // If receiver not found, Fail
        if (receiver === null) {
            req.flash("error", `Username ${req.body.username} not found!`);
            return res.redirect("/chats/new");
        }
        // If Receiver same as current User, Fail
        if (receiver.username === req.user.username) {
            req.flash("error", `Can't start chat with yourself`);
            return res.redirect("/chats/new");
        }

        // If User found successfully
        // Find chats with entered username
        const chats = req.user.chats.filter(
            chat => chat.to === receiver.username
        );

        if (chats.length !== 0) {
            // If chat found
            // Redirect to Chat Page
            return res.redirect(`/chats/${chats[0].chat}`);
        }

        // If chat not found
        // Create new Chat between the two Chatters
        const chat = await Chat.create({ messages: [] });

        // Add new Chat to current User's Chats
        req.user.chats.push({
            to: receiver.username,
            chat,
            unreadMessages: 0
        });

        // Add new Chat to Receiver's Chats
        receiver.chats.push({
            to: req.user.username,
            chat,
            unreadMessages: 0
        });

        await Promise.all([req.user.save(), receiver.save()]);

        // Redirect to Chat Page
        res.redirect(`/chats/${chat.id}`);

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});


// Get Request for New Chat Form Page
route.get("/new", checkLoggedIn, (req, res) => {
    // Render newChat with Current User's Details
    res.render("newChat", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Get Request for Chat Page
route.get("/:chatId", checkLoggedIn, async (req, res, next) => {
    try {
        // Find the chat in user's chats
        const chat = req.user.chats.find(
            chat => chat.chat.equals(req.params.chatId)
        );

        if (!chat) {
            return next();
        }

        // Render the chat page with Current Chat's Details
        res.render("chat", { title: chat.to });
        
    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});


// Export current Route
module.exports = route;