var route = require("express").Router();

// Databases
const User = require("../models/users.js");
const Chatter = require("../models/chatters");
const Group = require("../models/groups");
const Chat = require("../models/chats");


//====================
//       ROUTES
//====================


// Get Request for New Group Page
route.get("/new", function (req, res) {
    // Render newGroup with Current User's Details
    res.render("newGroup", {
        user: req.user,
        success: req.flash("success"),
        error: req.flash("error")
    });
});


// Post Request for Creating New Group
route.post("/new", function (req, res) {
    // Check if Group Name is Already present
    Group.findByName(req.body.groupName, function (err, group) {
        if (err) throw err;

        // If Group is already present
        if (group !== null) {
            req.flash("error", `Group ${req.body.groupName} already present!`)
            res.redirect("/groups/new");
        }
        else {
            // If Group is not Present

            // Find current Chatter
            Chatter.findByUsername(req.user.username, function (err, chatter) {
                if (err) throw err;

                // Create Chat for new Group
                Chat.create({
                    members: [
                        {
                            username: chatter.username,
                            unreadMessages: 0
                        }
                    ],
                    chat: []
                }, function (err, chat) {
                    if (err) throw err;

                    // Create the New Group
                    Group.create({
                        name: req.body.groupName,
                        chat: chat
                    }, function (err, group) {
                        if (err) throw err;

                        // Add new chat to Current Chatter
                        chatter.chats.push({
                            to: req.body.groupName,
                            chat: chat._id
                        });
                        chatter.save(function (err) {
                            if (err) throw err;

                            // Redirect User to New Chat Page
                            res.redirect(`/chats/${chat._id}`);
                        });
                    });
                });
            });
        }
    });
});

// Get Request for Join Group Page
route.get("/", function (req, res) {
    // Render newChat with Current User's Details
    res.render("joinGroup", {
        user: req.user,
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Post Request for Joining Group
route.post("/", function (req, res) {
    // Find group with entered Group Name
    Group.findByName( req.body.groupName, function (err, group) {
        if (err) throw err;

        // If Group not found
        if (group === null) {
            req.flash("error", `Group ${req.body.groupName} not found!`);
            res.redirect("/groups");
        }
        else {
            // If Group present
            // Find current Chatter
            Chatter.findByUsername(req.user.username, function (err, chatter) {
                if (err) throw err;

                // Find Group's Chat
                Chat.findById(group.chat, function(err, chat){
                    if(err) throw err;

                    // Add Chatter to Chat Members if not already present
                    if (chat.members.indexOf(chatter.username) == -1) {
                        chat.members.push({
                            username: chatter.username,
                            unreadMessages: 0
                        });
                        chat.save(function(err){
                            if(err) throw err;
                        });
                    }

                    // Add Group Chat to Chatter's Chats if not already present
                    if (chatter.chats.filter(function (chat) {
                            if (chat.chat.toString() == group.chat.toString())
                                return true;
                            return false;
                        }).length == 0) {

                        chatter.chats.push({
                            to: group.name,
                            chat: group.chat
                        });
                        chatter.save(function(err){
                            if(err) throw err;
                        });
                    }

                    res.redirect(`/chats/${group.chat}`);
                });

            });
        }
    });
});


// Export current Route
module.exports = route;