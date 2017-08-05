var route = require("express").Router();

// Databases
const User = require("../models/users.js");
const Chatter = require("../models/chatters");
const Channel = require("../models/channels");
const Chat = require("../models/chats");



//====================
//       ROUTES
//====================

// Get Request for Create Channel Page
route.get("/new", function (req, res) {
    // Find Current User
    User.findByUsername(req.user.username).then(function (user) {
        // Render newChannel with Current User's Details
        res.render("newChannel", {user});
    });
});

// Post Request for Creating New Channel
route.post("/new", function (req, res) {
    // Check if Channel Name is Already present
    Channel.findByName(req.body.channelName, function (err, channel) {
        if (err) throw err;

        // If Channel is already present
        if (channel !== null) {
            res.redirect("/channels/new");
        }
        else {
            // If Channel is not Present

            // Create Chat for new Channel
            Chat.create({
                chat: []
            }, function (err, chat) {
                if (err) throw err;

                // Create the New Channel
                Channel.create({
                    name: req.body.channelName,
                    members: [],
                    chat: chat
                }, function(err){
                    if(err) throw err;

                    // Redirect User to New Chat Page
                    res.redirect(`/channels/${chat._id}`);
                });
            });


        }
    });
});

// Get Request for Joining Channel Page
route.get("/", function (req, res) {
    // Find Current User
    User.findByUsername(req.user.username).then(function (user) {
        // Render newChannel with Current User's Details
        res.render("joinChannel", {user});
    });
});

// Post Request for Joining Channel
route.post("/", function (req, res) {
    // Find channel with entered Channel Name
    Channel.findByName(req.body.channelName, function (err, channel) {
        if (err) throw err;

        // If Channel not found
        if (channel === null) {
            res.redirect("/channels");
        }
        else {
            // Redirect to Chat's Page
            res.redirect(`/channels/${channel.chat}`);
        }
    });
});

// Post Request for Adding Channel to Favourite Channels
route.post("/fav", function (req, res) {
    // Search for current Chatter
    Chatter.findByUsername(req.user.username, function (err, chatter) {
        if (err) throw err;


        var foundChannel = false;

        for (var i = 0; i < chatter.favouriteChannels.length; ++i) {
            if (chatter.favouriteChannels[i].name == req.body.channelName) {

                // Channel already in favourite Channels
                // Remove from favourite Channels
                chatter.favouriteChannels.splice(i, 1);
                chatter.save();

                // We found the Channel
                foundChannel = true;
                break;
            }
        }

        if (!foundChannel) {
            // Channel not found
            // Add to favourite Channels

            // Find the Channel
            Channel.findByName(req.body.channelName, function (err, channel) {
                if (err) throw err;

                // Add Channel to Chatter's Favourite Channels
                chatter.favouriteChannels.push({
                    name: req.body.channelName,
                    chat: channel.chat
                });
                chatter.save();
            });

        }

        // Send if Channel is now Favourite or not
        res.send(!foundChannel);
    });
});

// Get Request for Favourite Channels Page
route.get("/fav", function (req, res) {
    // Find the current Chatter in chatters collection
    Chatter.findByUsername(req.user.username, function (err, chatter) {
        if (err) throw err;
        // Find current User
        User.findByUsername(chatter.username).then(function (user) {
            // Render favouriteChannels.ejs with Current User's Name, current Chatter
            res.render("favouriteChannels", {
                chatter,
                user
            });
        });
    });
});

// Get Request for Channel Page
route.get("/:chatId", function (req, res) {
    console.log(req.params.chatId);
    // Find current User
    User.findByUsername(req.user.username).then(function (user) {
        // Find Channel with Current Chat ID
        Channel.findByChatId(req.params.chatId, function (err, channel) {
            if (err) throw err;

            // Find the current Chatter
            Chatter.findByUsername(req.user.username, function (err, chatter) {
                if (err) throw err;


                var foundChannel = false;
                // Find Channel in Chatter's Favourite Channels
                for (var i = 0; i < chatter.favouriteChannels.length; ++i) {
                    if (chatter.favouriteChannels[i].name == channel.name) {
                        // We found the Channel
                        foundChannel = true;
                        break;
                    }
                }

                // Render the Channel Page with favourite if Found Channel
                res.render("channel", {
                    user: user,
                    title: channel.name,
                    favourite: foundChannel
                });
            });
        });
    });


});


// Export current Route
module.exports = route;