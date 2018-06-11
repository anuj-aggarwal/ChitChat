const route = require("express").Router();

// Databases
const { User, Chat } = require("../models");


//====================
//       ROUTES
//====================

// Get Request for the Profile Page, showing all Chats
route.get('/', async (req, res) => {
    try {
        // Get all Chats of User: URL, Name and unreadMessages
        const userChats = req.user.chats.map(chat => ({
            name: chat.to,
            link: `/chats/${chat.chat}`,
            unreadMessages: chat.unreadMessages
        }));

        const user = await req.user.populate("groups").execPopulate();
        
        // Get all Groups of User: URL, Name and unreadMessages
        const groupChats = user.groups.map(group => ({
            name: group.name,
            link: `/groups/${group.id}`,
            unreadMessages: group.members.find(member => member.username === user.username).unreadMessages
        }));

        // Stores all Chat Names, Redirect URLs and Unread Messages
        const chats = [...userChats, ...groupChats];


        // Don't Cache this page to reload chats!
        res.set('Cache-Control', 'no-store');

        // Render chats.ejs with chats
        res.render("chats", {
            chats,
            success: req.flash("success"),
            error: req.flash("error")
        });

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});

// Post Request to /chats to Add New Chat
route.post("/", async (req, res) => {
    try {
        // Find Chatter with entered Username
        const receiver = await Chatter.findByUsername(req.body.username);

        // If receiver not found, Fail
        if (receiver === null) {
            req.flash("error", `Username ${req.body.username} not found!`);
            return res.redirect("/chats/new");
        }
        // If Receiver same as current User, Fail
        if(receiver.username == req.user.username) {
            req.flash("error", `Can't start chat with yourself`);
            return res.redirect("/chats/new");
        }

        // If User found successfully
        // Find current chatter
        const chatter = await Chatter.findByUsername(req.user.username);

        // Find chats with entered username
        const chats = chatter.chats.filter(chat => {
            if (chat.to == receiver.username)
                return true;
            return false;
        });

        if(chats.length !== 0) {
            // If chat found
            // Redirect to Chat Page
            return res.redirect(`/chats/${chats[0].chat}`);
        }

        // If chat not found
        // Create new Chat between the two Chatters
        const chat = await Chat.create({
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
        });

        // Add new Chat to current User's Chats
        chatter.chats.push({
            to: receiver.username,
            chat: chat._id
        });
        await chatter.save();

        // Add new Chat to Receiver's Chats
        receiver.chats.push({
            to: chatter.username,
            chat: chat._id
        });
        await receiver.save();

        // Redirect to Chat Page
        res.redirect(`/chats/${chat._id}`);

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});


// Get Request for New Chat Form Page
route.get("/new", (req, res) => {
    // Render newChat with Current User's Details
    res.render("newChat", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Get Request for Chat Page
route.get("/:chatId", async (req, res) => {
    try {
        // Find current Chatter        
        const chatter = await Chatter.findByUsername(req.user.username);

        // Find Chat with Current Chat ID
        for (const chat of chatter.chats) {
            // == to coerce chat.chat(ObjectId) into a String
            if (chat.chat == req.params.chatId) {
                // Render the chat page with Current Chat's Details
                res.render("chat", {
                    title: chat.to
                });
                break;
            }
        }
    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});


// Export current Route
module.exports = route;