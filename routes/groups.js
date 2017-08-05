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
    // Find Current User
    User.findByUsername(req.user.username).then(function (user) {
        // Render newGroup with Current User's Details
        res.render("newGroup", {user});
    });
});


// Post Request for Creating New Group
route.post("/new", function (req, res) {
    // Check if Group Name is Already present
    Group.findByName(req.body.groupName, function (err, group) {
        if (err) throw err;

        // If Group is already present
        if (group !== null) {
            res.redirect("/groups/new");
        }
        else {
            // If Group is not Present

            // Find current Chatter
            Chatter.findByUsername(req.user.username, function (err, chatter) {
                if (err) throw err;
                // Create Chat for new Group
                Chat.create({
                    chat: []
                }, function (err, chat) {
                    if (err) throw err;

                    // Create the New Group
                    Group.create({
                        name: req.body.groupName,
                        members: [chatter._id],
                        chat: chat
                    }, function(err){
                        if(err) throw err;

                        // Add new chat to Current Chatter
                        chatter.chats.push({
                            to: req.body.groupName,
                            isGroup: true,
                            chat: chat._id
                        });
                        chatter.save(function(err){
                            if(err) throw err;

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
    // Find Current User
    User.findByUsername(req.user.username).then(function (user) {
        // Render newChat with Current User's Details
        res.render("joinGroup", {user});
    });
});

// Post Request for Joining Group
route.post("/", function (req, res) {
    // Find group with entered Group Name
    Group.findByName(req.body.groupName, function (err, group) {
        if (err) throw err;

        // If Group not found
        if (group === null) {
            res.redirect("/groups");
        }
        else {
            // If Group present
            // Find current Chatter
            Chatter.findByUsername(req.user.username, function (err, chatter) {
                if (err) throw err;

                // Add Chatter to Group Members if not already present
                if (group.members.indexOf(chatter._id) == -1) {
                    group.members.push(chatter._id);
                    group.save();
                }


                // Add Group Chat to Chatter's Chats if not already present
                if (chatter.chats.filter(function (chat) {
                        if (chat.chat.toString() == group.chat.toString())
                            return true;
                        return false;
                    }).length == 0) {

                    chatter.chats.push({
                        to: group.name,
                        isGroup: true,
                        chat: group.chat
                    });
                    chatter.save();
                }

                res.redirect(`/chats/${group.chat}`);

            });
        }
    });
});



// Export current Route
module.exports = route;