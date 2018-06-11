const route = require("express").Router();

// Databases
const { Chatter, Group, Chat } = require("../models");


//====================
//       ROUTES
//====================


// Get Request for New Group Page
route.get("/new", function (req, res) {
    // Render newGroup with Current User's Details
    res.render("newGroup", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});


// Post Request for Creating New Group
route.post("/new", async (req, res) => {
    try {
        // Check if Group Name is Already present
        const group = await Group.findByName(req.body.groupName);

        // If Group is already present
        if (group !== null) {
            req.flash("error", `Group ${req.body.groupName} already present!`);
            return res.redirect("/groups/new");
        }

        // If Group is not Present
        // Find current Chatter
        const chatter = await Chatter.findByUsername(req.user.username);

        // Create Chat for new Group
        const chat = await Chat.create({
            members: [
                {
                    username: chatter.username,
                    unreadMessages: 0
                }
            ],
            chat: []
        });

        // Create the New Group
        await Group.create({
            name: req.body.groupName,
            chat: chat
        });

        // Add new chat to Current Chatter
        chatter.chats.push({
            to: req.body.groupName,
            chat: chat._id
        });
        await chatter.save();

        // Redirect User to New Chat Page
        res.redirect(`/chats/${chat._id}`);

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }    
});

// Get Request for Join Group Page
route.get("/", function (req, res) {
    // Render newChat with Current User's Details
    res.render("joinGroup", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Post Request for Joining Group
route.post("/", async (req, res) => {
    try {
        // Find group with entered Group Name        
        const group = await Group.findByName( req.body.groupName);

        // If Group not found
        if (group === null) {
            req.flash("error", `Group ${req.body.groupName} not found!`);
            return res.redirect("/groups");
        }

        // Else, Group present
        // Find current Chatter
        const chatter = await Chatter.findByUsername(req.user.username);

        // Find Group's Chat
        const chat = await Chat.findById(group.chat);
        
        // Add Chatter to Chat Members if not already present
        if (chat.members.indexOf(chatter.username) == -1) {
            chat.members.push({
                username: chatter.username,
                unreadMessages: 0
            });
            await chat.save();
        }

        // Add Group Chat to Chatter's Chats if not already present
        if (chatter.chats.filter(chat => (chat.chat.toString() == group.chat.toString()))
                         .length == 0) {

            chatter.chats.push({
                to: group.name,
                chat: group.chat
            });
            await chatter.save();
        }

        res.redirect(`/chats/${group.chat}`);

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});


// Export current Route
module.exports = route;