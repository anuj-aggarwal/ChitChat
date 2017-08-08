var route = require("express").Router();

// Databases
const User = require("../models/users.js");
const Chatter = require("../models/chatters");
const Chat = require("../models/chats");


//====================
//       ROUTES
//====================

// Get Request for the Profile Page, showing all Chats
route.get('/', function (req, res) {
    // Find the current Chatter in chatters collection
    Chatter.findOne({
        username: req.user.username
    }, function (err, chatter) {
        if (err) throw err;

        // Render chats.ejs with Current User's Name, current Chatter
        res.render("chats", {
            chatter,
            user: req.user
        });
    });
});

// Post Request to /chats to Add New Chat
route.post("/", function (req, res) {
    // Find Chatter with entered Username
    Chatter.findOne({
        username: req.body.username
    }, function (err, receiver) {
        if (err) throw err;

        // If receiver not found or Receiver same as current User, Fail
        if (receiver === null || receiver.username == req.user.username) {
            res.redirect("/chats/new");
        }
        else {
            // If User found successfully
            // Find current chatter
            Chatter.findOne({
                username: req.user.username
            }, function (err, chatter) {
                if (err) throw err;

                // Find chats with entered username
                var chats = chatter.chats.filter(function (chat) {
                    if (chat.to == receiver.username)
                        return true;
                    return false;
                });

                // If chat not found
                if (chats.length == 0) {
                    // Create new Chat between the two Chatters, redirect to Chat Page

                    // Create new empty chat
                    Chat.create({
                        members: [
                            {
                                username: chatter.username,
                                unreadMessages: 0
                            },
                            {
                                username: receiver.username,
                                unreadMessages: 0
                            }
                        ],
                        chat: []
                    }, function (err, chat) {
                        if (err) throw err;

                        // Add new Chat to current User's Chats
                        chatter.chats.push({
                            to: receiver.username,
                            chat: chat._id
                        });
                        chatter.save(function (err) {
                            if (err) throw err;

                            // Add new Chat to Receiver's Chats
                            receiver.chats.push({
                                to: chatter.username,
                                chat: chat._id
                            });
                            receiver.save(function (err) {
                                if (err) throw err;

                                // Redirect to Chat Page
                                res.redirect(`/chats/${chat._id}`);
                            });
                        });
                    });
                }
                else {
                    // Redirect to Chat Page if Chat already exists
                    res.redirect(`/chats/${chats[0].chat}`);
                }
            });
        }
    });
});


// Get Request for New Chat Form Page
route.get("/new", function (req, res) {
    // Render newChat with Current User's Details
    res.render("newChat", {user: req.user});
});

// Get Request for Chat Page
route.get("/:chatId", function (req, res) {
    // Find current Chatter
    Chatter.findOne({
        username: req.user.username
    }, function (err, chatter) {
        if (err) throw err;

        // Find Chat with Current Chat ID
        for (chat of chatter.chats) {
            if (chat.chat == req.params.chatId) {
                // Render the chat page with Current Chat's Details
                res.render("chat", {
                    user: req.user,
                    title: chat.to
                });
                break;
            }
        }
    })
});


// Export current Route
module.exports = route;