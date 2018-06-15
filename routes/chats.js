// Databases
const { User, Bot, Chat } = require("../models");

// Utilities
const { checkLoggedIn } = require("../utils/auth");


//====================
//       ROUTES
//====================

module.exports = (io, bots) => {
    const route = require("express").Router();

    // Get Request for the Profile Page, showing all Chats
    route.get("/", checkLoggedIn, async (req, res) => {
        try {
            // Get all Chats of User: URL, Name and unreadMessages
            const userChats = req.user.chats.map(chat => ({
                name: chat.to,
                link: `/chats/${chat.chat}/chat`,
                unreadMessages: chat.unreadMessages
            }));

            const user = await req.user.populate("groups").execPopulate();

            // Get all Groups of User: URL, Name and unreadMessages
            const groupChats = user.groups.map(group => ({
                name: group.name,
                link: `/groups/${group.id}/chat`,
                unreadMessages: group.members.find(member => member.username === user.username).unreadMessages
            }));

            // Stores all Chat Names, Redirect URLs and Unread Messages
            const chats = [...userChats, ...groupChats];


            // Don't Cache this page to reload chats!
            res.set("Cache-Control", "no-store");

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

    // Function to add Chat between two users/bots
    const addChat = async (user, receiver, isBot, res) => {
        // Find chats with entered username
        const chats = user.chats.filter(
            chat => chat.to === receiver.username
        );

        if (chats.length !== 0) {
            // If chat found
            // Redirect to Chat Page
            return res.redirect(`/chats/${chats[0].chat}/chat`);
        }

        // If chat not found
        // Create new Chat between the two Chatters
        const chat = await Chat.create({ messages: [] });

        // Add new Chat to current User's Chats
        user.chats.push({
            to: receiver.username,
            isBot,
            chat,
            unreadMessages: 0
        });

        // Add new Chat to Receiver's Chats
        receiver.chats.push({
            to: user.username,
            isBot: isBot ? undefined : false,
            chat,
            unreadMessages: 0
        });

        await Promise.all([user.save(), receiver.save()]);

        return chat;
    };

    // Post Request to /chats to Add New Chat
    route.post("/", checkLoggedIn, async (req, res) => {
        try {
            // Find User with entered Username
            let receiver = await User.findByUsername(req.body.username);

            // If receiver not found, Check for Bot
            if (receiver === null) {
                // Check for Bot
                receiver = await Bot.findByUsername(req.body.username);

                // If not a Bot too
                if (receiver === null) {
                    req.flash("error", `Username ${req.body.username} not found!`);
                    return res.redirect("/chats/new");
                }
                
                const chat = await addChat(req.user, receiver, true, res);

                // If bot is active, move it to the room also
                const botSocket = bots[receiver.username];
                if (botSocket) {
                    botSocket.join(req.user.username);
                    // Emit the New Chat notification to Bot
                    botSocket.emit("new chat", { username: req.user.username });
                }

                // Redirect to Chat Page
                return res.redirect(`/chats/${chat.id}/chat`);
            }

            // If Receiver same as current User, Fail
            if (receiver.username === req.user.username) {
                req.flash("error", `Can't start chat with yourself`);
                return res.redirect("/chats/new");
            }

            // If User found successfully
            const chat = await addChat(req.user, receiver, false, res);

            // Redirect to Chat Page
            return res.redirect(`/chats/${chat.id}/chat`);

        } catch (err) {
            console.error(err.stack);
            res.sendStatus(500);
        }
    });


    // Get Request for New Chat Form Page
    route.get("/new", checkLoggedIn, (req, res) => {
        // Render newChat with Current User's Details
        res.render("chat/new", {
            success: req.flash("success"),
            error: req.flash("error")
        });
    });

    // Get Request for Chat Page
    route.get("/:chatId/chat", checkLoggedIn, async (req, res, next) => {
        try {
            // Find the chat in user's chats
            const chat = req.user.chats.find(
                chat => chat.chat.equals(req.params.chatId)
            );

            if (!chat) {
                return next();
            }

            // Render the chat page with Current Chat's Details
            res.render("chat", { title: chat.to });
            
        } catch (err) {
            console.error(err.stack);
            res.sendStatus(500);
        }
    });


    return route;
};