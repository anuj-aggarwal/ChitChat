const { User, Bot, Chat, Channel } = require("../models");
const { sanitizeMessage } = require("../utils/sanitize");

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
            socket.channels = {};
            socket.chats = bot.chats.reduce((acc, chat) => {
                acc[chat.to] = chat.chat;
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

        // To send a message to a user Chat
        socket.on("message user", async ({ username, body }) => {
            // Sanitize and trim the Message Body
            body = sanitizeMessage(body);

            // Don't send Empty Messages
            if (body === "")
                return;
            
            const message = { body, sender: socket.username };

            try {
                const chatId = socket.chats[username];
                
                // Push the new message in chat's messages
                await Chat.update(
                    { _id: chatId },
                    { $push: { messages: message } }
                );

                // Update the unread Messages of receiver if receiver not connected
                const socketIds = Object.keys(io.of("/chats").in(chatId).sockets);
                const sockets = socketIds.map(
                    id => io.of("/.chats").in(chatId).sockets[id]
                );

                if (!sockets.find(socket => socket.username === username)) {
                    // Receiver is not connected

                    // Increment receiver's unread Messages
                    await User.update({
                        $and: [{ username }, { "chats.chat": chatId }]
                    }, {
                        $inc: { "chats.$.unreadMessages": 1 }
                    });
                }
                else {
                    // Send message to User
                    io.of("/chats").to(chatId).emit("message", message);
                }

            } catch (err) {
                console.error(err.stack);
                throw err;
            }
        });

        
        // Channel Join Request
        socket.on("join channel", async (channelName) => {
            // Find the channel
            const channel = await Channel.findByName(channelName);
            if (channel === null)
                socket.emit("join error", "Channel not found!");
            
            // Channel found
            // Add Bot to the Channel's Room
            socket.join(channelName);
            socket.channels[channelName] = channel.id;

            // Send all Users and Bots to all users and bots
            // Users
            const userSocketIds = Object.keys(io.of("/channels").in(channel.id).sockets);
            const userSockets = userSocketIds.map(
                id => io.of("/channels").in(channel.id).sockets[id].username
            );
            // Bots
            const botSocketIds = Object.keys(nsp.in(channel.name).sockets);
            const botSockets = botSocketIds.map(
                id => nsp.in(channel.name).sockets[id].username
            );

            // Emit the array of all users and bots connected to all users and bots
            io.of("/channels").to(channel.id).emit("Members", [...userSockets, ...botSockets]);
            nsp.to(channel.name).emit("Members", [...userSockets, ...botSockets]);

            // Emit Alert Message to all users and bots
            io.of("/channels").to(channel.id).emit("alert", `${socket.username} has joined the Channel.....`);
            nsp.to(channel.name).emit("alert", `${socket.username} has joined the Channel.....`);
        });

        // Send message to channel
        socket.on("message channel", async ({ channel: channelName, body, for: forArray }) => {
            // Sanitize and trim the Message Body
            body = sanitizeMessage(body);

            // Don't add Empty Messages
            if (body === "")
                return;

            const message = {
                sender: socket.username,
                body,
                for: forArray
            };

            try {
                const channel = await Channel.findByName(channelName);

                // Push the new message in chat's messages
                await Chat.update(
                    { _id: channel.chat },
                    { $push: { messages: message } }
                );

                // Emit the new chat to all users in the room
                io.of("/channels").to(channel.id).emit("message", message);
                // Emit the new chat to bots room
                nsp.to(channel.name).emit("channel message", { ...message, channel: channel.name });

            } catch (err) {
                console.log(err.stack);
                throw err;
            }
        });


        // Remove the bot's socket from bots object on socket disconnect
        socket.on("disconnect", () => {
            delete bots[socket.username];

            for (const channel in socket.channels) {
                // Emit Alert Message of this disconnection to all users and bots
                io.of("/channels").to(socket.channels[channel]).emit("alert", `${socket.username} has left the Channel.....`);
                nsp.to(channel).emit("alert", `${socket.username} has left the Channel.....`);
            }
        });
    });
};