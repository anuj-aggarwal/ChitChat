const route = require("express").Router();

// Databases
const { Chatter, Channel, Chat } = require("../models");



//====================
//       ROUTES
//====================

// Get Request for Create Channel Page
route.get("/new", (req, res) => {
    // Render newChannel with Current User's Details
    res.render("newChannel", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Post Request for Creating New Channel
route.post("/new", async (req, res) => {
    
    try {
        // Check if Channel Name is Already present
        const channel = await Channel.findByName(req.body.channelName);

        // If Channel is already present
        if(channel!==null){
            req.flash("error", `Channel ${req.body.channelName} already exists!`);
            return res.redirect("/channels/new");
        }

        // If Channel is not Present
        // Create Chat for new Channel
        const chat = await Chat.create({
            members: [],
            chat: []
        });
        
        // Create the New Channel
        await Channel.create({
            name: req.body.channelName,
            chat: chat
        });

        // Redirect User to New Chat Page
        res.redirect(`/channels/${chat._id}`);

    } catch (err) {
        console.error(err.stack);
        return res.sendStatus(500);
    }
});

// Get Request for Joining Channel Page
route.get("/", (req, res) => {
    // Render newChannel with Current User's Details
    res.render("joinChannel", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Post Request for Joining Channel
route.post("/", async (req, res) => {
    try {
        // Find channel with entered Channel Name
        const channel = await Channel.findByName(req.body.channelName);

        // If Channel not found
        if (channel === null) {
            req.flash("error", `Channel ${req.body.channelName} does not exist!`);
            return res.redirect("/channels");
        }
        // Redirect to Chat's Page
        res.redirect(`/channels/${channel.chat}`);

    } catch (err) {
        console.error(err.stack);
        return res.sendStatus(500);
    }
});

// Post Request for Adding Channel to Favourite Channels
route.post("/fav", async (req, res) => {
    try {
        const chatter = await Chatter.findByUsername(req.user.username);

        for (let i = 0; i < chatter.favouriteChannels.length; ++i) {
            if (chatter.favouriteChannels[i].name == req.body.channelName) {

                // Channel already in favourite Channels
                // Remove from favourite Channels
                chatter.favouriteChannels.splice(i, 1);
                await chatter.save();

                // We found the Channel
                // Send that channel is not favourite now
                res.send(false);
                return;
            }
        }

        // Channel not found
        // Add to favourite Channels

        const channel = await Channel.findByName(req.body.channelName);

        // Add Channel to Chatter's Favourite Channels
        chatter.favouriteChannels.push({
            name: req.body.channelName,
            chat: channel.chat
        });
        await chatter.save();
        
        // Channel is now Favourite
        res.send(true);

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});

// Get Request for Favourite Channels Page
route.get("/fav", async (req, res) => {
    try {
        // Find the current Chatter in chatters collection
        const chatter = await  Chatter.findByUsername(req.user.username);

        // Render favouriteChannels.ejs with Current User, Chatter
        res.render("favouriteChannels", { chatter });

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});

// Get Request for Channel Page
route.get("/:chatId", async (req, res) => {
    try {
        // Find Channel with Current Chat ID
        const channel = await Channel.findByChatId(req.params.chatId);

        // Find the current Chatter
        const chatter = await Chatter.findByUsername(req.user.username);

        let foundChannel = false;
        // Find Channel in Chatter's Favourite Channels
        for (let i = 0; i < chatter.favouriteChannels.length; ++i) {
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

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});


// Export current Route
module.exports = route;