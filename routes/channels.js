const route = require("express").Router();

// Databases
const { Channel, Chat } = require("../models");

// Utilities
const { checkLoggedIn } = require("../utils/auth");


//====================
//       ROUTES
//====================

// Get Request for Create Channel Page
route.get("/new", checkLoggedIn, (req, res) => {
    // Render newChannel with Current User's Details
    res.render("newChannel", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Post Request for Creating New Channel
route.post("/new", checkLoggedIn, async (req, res) => {
    try {
        // Check if Channel Name is Already present
        const channel = await Channel.findByName(req.body.channelName);

        // If Channel is already present
        if (channel !== null) {
            req.flash("error", `Channel ${req.body.channelName} already exists!`);
            return res.redirect("/channels/new");
        }

        // If Channel is not Present
        // Create Chat for new Channel
        const chat = await Chat.create({
            chat: []
        });

        // Create the New Channel
        const newChannel = await Channel.create({
            name: req.body.channelName,
            chat: chat
        });

        // Redirect User to New Chat Page
        res.redirect(`/channels/${newChannel.id}`);

    } catch (err) {
        console.error(err.stack);
        return res.sendStatus(500);
    }
});

// Get Request for Joining Channel Page
route.get("/", checkLoggedIn, (req, res) => {
    // Render newChannel with Current User's Details
    res.render("joinChannel", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Post Request for Joining Channel
route.post("/", checkLoggedIn, async (req, res) => {
    try {
        // Find channel with entered Channel Name
        const channel = await Channel.findByName(req.body.channelName);

        // If Channel not found
        if (channel === null) {
            req.flash("error", `Channel ${req.body.channelName} does not exist!`);
            return res.redirect("/channels");
        }

        // Redirect to Chat's Page
        res.redirect(`/channels/${channel.id}`);

    } catch (err) {
        console.error(err.stack);
        return res.sendStatus(500);
    }
});

// Post Request for Adding Channel to Favourite Channels
route.post("/fav", checkLoggedIn, async (req, res) => {
    try {
        // Find the Channel in User's Favourite Channels
        const index = req.user.favouriteChannels.findIndex(
            channel => channel.equals(req.body.channelId)
        );

        // If Channel already in Favourite Channels, remove it
        if (index !== -1) {
            req.user.favouriteChannels.splice(index, 1);
            await req.user.save();
            return res.send(false);
        }

        // Channel not found in favourite Channels
        // Search Channel in all channels
        const channel = await Channel.findById(req.body.channelId);
        if (channel === null) {
            return res.status(404).send({ err: "Channel not found!" });
        }

        // Add to favourite Channels
        req.user.favouriteChannels.push(channel);
        await req.user.save();

        // Channel is now Favourite
        res.send(true);

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});

// Get Request for Favourite Channels Page
route.get("/fav", checkLoggedIn, async (req, res) => {
    try {
        // Populate Channels in Current user
        const user = await req.user.populate("favouriteChannels").execPopulate();
        // Render favouriteChannels.ejs with Populated User
        res.render("favouriteChannels", { user });

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});

// Get Request for Channel Page
route.get("/:channelId", checkLoggedIn, async (req, res) => {
    try {
        // Find Channel with the Channel ID
        const channel = await Channel.findById(req.params.channelId);

        // Find Channel in User's Favourite Channels
        const foundChannel =
            req.user.favouriteChannels.findIndex(channel =>
                channel.equals(req.params.channelId)
            ) !== -1;

        // Render the Channel Page with favourite if Found Channel
        res.render("channel", {
            channel,
            favourite: foundChannel
        });

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});


// Export current Route
module.exports = route;