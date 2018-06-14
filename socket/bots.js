const { Bot } = require("../models");

module.exports = (io, bots) => {
    const nsp = io.of("/bots");
    nsp.on("connection", socket => {
        // Wait for Authentication Details from the Bot
        socket.on("auth data", async ({ username, secret }) => {
            // Check for Valid Credentials
            const bot = await Bot.findOne({ username, secret });

            if (bot === null) {
                // Bot not found!
                // Emit Authentication failure and disconnect the Bot
                socket.emit("auth error", "Invalid Credentials");
                socket.disconnect();
            }

            // Bot found
            // Emit Authenticated Event and add bot to bots Object
            socket.emit("authenticated");

            // Add bot name in socket and all chats IDs
            socket.username = username;
            socket.chats = bot.chats.reduce((acc, chat) => {
                acc[chat.to] = chat.id;
                return acc;
            }, {});

            // Add Bot to all chats' rooms
            bot.chats.forEach(({ to }) => {
                socket.join(to);
            });

            bots[username] = socket;

            // Send all unread messages to bot for each chat
            await bot.populate("chats.chat").execPopulate();
            bot.chats.forEach(chat => {
                if (chat.unreadMessages === 0)
                    return;
                    
                // Get only unread messages
                let messages = chat.chat.messages;
                // Get last 'unreadMessages' messages
                messages = messages.splice(messages.length - chat.unreadMessages, chat.unreadMessages);
                messages = messages.map(message => ({
                    username: chat.to,
                    sender: message.sender,
                    body: message.body
                }));

                socket.emit("unread messages", messages);
            });

            // Clear bots unread messages
            bot.chats.forEach(chat => {
                chat.unreadMessages = 0;
            });
            
            await bot.save();
        });


        socket.on("disconnect", () => {
            delete bots[socket.username];
        });
    });
};