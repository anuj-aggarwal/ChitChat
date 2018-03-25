var route = require("express").Router();

// Databases
const { User, Chatter, Chat } = require("../models");


//====================
//       ROUTES
//====================

// Get Request for the Profile Page, showing all Chats
route.get('/', function (req, res) {
    // Find the current Chatter in chatters collection
    Chatter.findByUsername(req.user.username, function (err, chatter) {
        if (err) throw err;

        // Find Chat IDs of all chats of current Chatter
        var chatIds = [];
        chatter.chats.forEach(function(chat, index){
            chatIds[index] = chat.chat;
        });

        // Find the unreadMessages of each chat
        var unreadMessages = [];
        // Find all Chats with id in ChatIds
        // and update the unreadMessages Array
        Chat.find({
            _id:{$in: chatIds}
        }, function(err, chats){
            if(err) throw err;

            // For each Chat, update unread messages of current Chatter
            chats.forEach(function(chat, index){
                chat.members.forEach(function(member){
                    if(member.username == chatter.username)
                        unreadMessages[index] = member.unreadMessages;
                });
            });

            // Don't Cache this page to reload chats!
            res.set('Cache-Control', 'no-store');

            // Render chats.ejs with Current User, Chatter, unread Messages Array
            res.render("chats", {
                chatter,
                unreadMessages,
                user: req.user,
                success: req.flash("success"),
                error: req.flash("error")
            });
        });
    });
});

// Post Request to /chats to Add New Chat
route.post("/", function (req, res) {
    // Find Chatter with entered Username
    Chatter.findByUsername(req.body.username, function (err, receiver) {
        if (err) throw err;

        // If receiver not found, Fail
        if (receiver === null) {
            req.flash("error", `Username ${req.body.username} not found!`);
            res.redirect("/chats/new");
        }
        // If Receiver same as current User, Fail
        else if(receiver.username == req.user.username) {
            req.flash("error", `Can't start chat with yourself`);
            res.redirect("/chats/new");
        }
        else {
            // If User found successfully
            // Find current chatter
            Chatter.findByUsername(req.user.username, function (err, chatter) {
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
    res.render("newChat", {
        user: req.user,
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Get Request for Chat Page
route.get("/:chatId", function (req, res) {
    // Find current Chatter
    Chatter.findByUsername(req.user.username, function (err, chatter) {
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