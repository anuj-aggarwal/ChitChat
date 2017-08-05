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
    console.log("Reached");
    // Find the current Chatter in chatters collection
    Chatter.findOne({
        username: req.user.username
    }).populate("chat").exec(function (err, chatter) {    // Populate the chats in the chatters collection
        if (err) throw err;
        // Find current User
        User.findByUsername(chatter.username).then(function (user) {
            // Render chats.ejs with Current User's Name, current Chatter
            res.render("chats", {
                chatter,
                user
            });
        });
    });
});

// Post Request to /chats to Add New Chat
route.post("/", function (req, res) {
    // Find User with entered Username
    User.findByUsername(req.body.username).then(function (user) {
        // If user not found or Username same as current User, Fail
        if (user === null || user.username == req.user.username) {
            res.redirect("/chats/new");
        }
        else {
            // If User found successfully
            // Find current chatter
            Chatter.findByUsername(req.user.username, function (err, chatter) {
                // Find chats with entered username
                var chats = chatter.chats.filter(function (chat) {
                    if (chat.to == req.body.username)
                        return true;
                    return false;
                });

                // If chat not found
                if (chats.length == 0) {
                    // Create new Chat between the two Chatters, redirect to Chat Page
                    createChat(req.user.username, req.body.username, function (chatId) {
                        console.log(chatId);
                        // Redirect to Chat Page
                        res.redirect(`/chats/${chatId}`);
                    });
                }
                else {
                    // Redirect to Chat Page if Chat already exists
                    res.redirect(`/chats/${chats[0].chat}`);
                }
            });
        }
    });

    // Function to Create Chat between two Chatters
    // Returns Chat ID of newly created Chat as a parameter to Callback Function
    function createChat(sender, receiver, cb) {
        // Create new empty Chat
        Chat.create({
            chat: []
        }, function (err, chat) {
            if (err) throw err;
            // Find the current User
            Chatter.findByUsername(sender, function (err, chatter) {
                if (err) throw err;
                // Add new Chat to current User's Chats
                chatter.chats.push({
                    to: receiver,
                    isGroup: false,
                    chat: chat
                });
                chatter.save(function (err) {
                    if(err) throw err;

                    // Find the entered User
                    Chatter.findByUsername(receiver, function (err, chatter) {
                        if (err) throw err;
                        // Add new Chat to entered User's Chats
                        chatter.chats.push({
                            to: sender,
                            isGroup: false,
                            chat: chat
                        });
                        chatter.save(function (err) {
                            if(err) throw err;

                            // Call the Callback with new Chat's ID
                            cb(chat._id);
                        });
                    });
                });
            });
        })
    }
});


// Get Request for New Chat Form Page
route.get("/new", function (req, res) {
    // Find Current User
    User.findByUsername(req.user.username).then(function (user) {
        // Render newChat with Current User's Details
        res.render("newChat", {user});
    });
});

// Get Request for Chat Page
route.get("/:chatId", function (req, res) {
    // Find current Chatter
    Chatter.findByUsername(req.user.username, function (err, chatter) {
        if (err) throw err;

        // Find current User
        User.findByUsername(chatter.username).then(function (user) {
            // Find Chat with Current Chat ID
            for (chat of chatter.chats) {
                if (chat.chat == req.params.chatId) {
                    // Render the chat page with Current Chat's Details
                    res.render("chat", {
                        chatter,
                        user,
                        title: chat.to
                    });
                    break;
                }
            }
        });
    })

});


// Export current Route
module.exports = route;