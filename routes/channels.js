var route = require("express").Router();

// Databases
const { User, Chatter, Channel, Chat } = require("../models");



//====================
//       ROUTES
//====================

// Get Request for Create Channel Page
route.get("/new", function (req, res) {
    // Render newChannel with Current User's Details
    res.render("newChannel", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Post Request for Creating New Channel
route.post("/new", function (req, res) {
    // Check if Channel Name is Already present
    Channel.findByName(req.body.channelName, function(err, channel){
        if(err) throw err;

        // If Channel is already present
        if(channel!==null){
            req.flash("error", `Channel ${req.body.channelName} already exists!`);
            res.redirect("/channels/new");
        }
        else {
            // If Channel is not Present

            // Create Chat for new Channel
            Chat.create({
                members: [],
                chat: []
            }, function(err, chat){
                if(err) throw err;

                // Create the New Channel
                Channel.create({
                    name: req.body.channelName,
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
    // Render newChannel with Current User's Details
    res.render("joinChannel", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Post Request for Joining Channel
route.post("/", function (req, res) {
    // Find channel with entered Channel Name
    Channel.findByName(req.body.channelName, function(err, channel){
        if(err) throw err;

        // If Channel not found
        if (channel === null) {
            req.flash("error", `Channel ${req.body.channelName} does not exist!`);
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
    Chatter.findByUsername(req.user.username, function(err, chatter){
        if(err) throw err;

        var foundChannel = false;

        for (var i = 0; i < chatter.favouriteChannels.length; ++i) {
            if (chatter.favouriteChannels[i].name == req.body.channelName) {

                // Channel already in favourite Channels
                // Remove from favourite Channels
                chatter.favouriteChannels.splice(i, 1);
                chatter.save(function(err){
                    if(err) throw err;
                });

                // We found the Channel
                foundChannel = true;
                break;
            }
        }

        if (!foundChannel) {
            // Channel not found
            // Add to favourite Channels

            // Find the Channel
            Channel.findByName(req.body.channelName, function(err, channel){
                if(err) throw err;

                // Add Channel to Chatter's Favourite Channels
                chatter.favouriteChannels.push({
                    name: req.body.channelName,
                    chat: channel.chat
                });
                chatter.save(function(err){
                    if(err) throw err;
                });
            });
        }

        // Send if Channel is now Favourite or not
        res.send(!foundChannel);
    });
});

// Get Request for Favourite Channels Page
route.get("/fav", function (req, res) {
    // Find the current Chatter in chatters collection
    Chatter.findByUsername(req.user.username, function(err, chatter){
        if(err) throw err;

        // Render favouriteChannels.ejs with Current User, Chatter
        res.render("favouriteChannels", {
            chatter
        });
    });
});

// Get Request for Channel Page
route.get("/:chatId", function (req, res) {
    // Find Channel with Current Chat ID
    Channel.findByChatId(req.params.chatId, function(err, channel){
        if(err) throw err;

        // Find the current Chatter
        Chatter.findByUsername(req.user.username, function(err, chatter){
            if(err) throw err;

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
                title: channel.name,
                favourite: foundChannel
            });
        });
    });
});


// Export current Route
module.exports = route;