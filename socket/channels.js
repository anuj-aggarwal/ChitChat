const { Chat, Channel } = require("../models");
const { sanitizeMessage } = require("../utils/sanitize");

module.exports = (io, channels) => {
    const nsp = io.of("/channels");
    nsp.on("connection", socket => {
        socket.on("data", async ({ url, username }) => {
            // Store the username in socket
            socket.username = username;

            // Extract chat ID from url
            socket.channelId = url.split("/")[2];

            // Add Socket to Room with name same as Channel ID
            // Creates new Room if not exists
            const channel = await Channel.findById(socket.channelId)
            socket.join(socket.channelId);
            channels[socket.channelId] = { name: channel.name, chat: channel.chat };

            
            // Send all new Users and Bots members to all users and bots
            // Users
            const userSocketIds = Object.keys(nsp.in(socket.channelId).sockets);
            const userSockets = userSocketIds.map(
                id => nsp.in(socket.channelId).sockets[id].username
            );
            // Bots
            const botSocketIds = Object.keys(io.of("/bots").in(socket.channelId).sockets);
            const botSockets = botSocketIds.map(
                id => io.of("/bots").in(socket.channelId).sockets[id].username
            );

            // Emit the array of all usernames connected to users
            nsp.to(socket.channelId).emit("Members", [...userSockets, ...botSockets]);
            // Emit the array of all usernames connected to bots
            io.of("/bots").to(socket.channelId).emit("Members", {
                channel: channel.name,
                members: [...userSockets, ...botSockets]
            });

            // Emit that current user has joined Channel
            nsp.to(socket.channelId).emit("alert", `${socket.username} has joined the Channel.....`);
            io.of("/bots").to(socket.channelId).emit("alert", {
                channel: channel.name,
                body: `${socket.username} has joined the Channel.....`
            });

        });


        // On receiving New message from User
        socket.on("new message", async text => {
            // Sanitize and trim the Message Text
            text = sanitizeMessage(text);

            // Don't add Empty Messages
            if (text === "")
                return;

            const message = {
                sender: socket.username,
                body: text,    
                for: []
            };

            // Check for a Whisper
            if (message.body[0] === "@") {
                // Remove '@' & Split on ':'
                const messageArray = message.body.slice(1).split(":");

                // Update message's for array
                message.for.push(messageArray[0].trim());
                message.for.push(message.sender);

                // Join the rest of the body
                message.body = messageArray.slice(1).join(":");
            }

            try {
                const channel = channels[socket.channelId]

                // Push the new message in chat's messages
                await Chat.update(
                    { _id: channel.chat },
                    { $push: { messages: message } }
                );

                // Emit the new chat to all users in the room
                nsp.to(socket.channelId).emit("message", message);
                // Emit the new chat to bots room
                io.of("/bots").to(socket.channelId).emit("channel message", {
                    channel: channel.name,
                    ...message
                });

            } catch (err) {
                console.error(err.stack);
                throw err;
            }
        });


        // When User typed in Chat Box
        socket.on("typed", username => {
            // Emit username is typing message to others in room except socket
            socket.to(socket.channelId).broadcast.emit("typing", username);
        });

        // Remove User from Members of Channel on leaving
        socket.on("disconnect", async () => {
            // Emit the new Chat members

            // Find clients connected in the Channel's Room and
            // Send all new Users and Bots members to all users and bots
            const channel = channels[socket.channelId];
            // Users
            const userSocketIds = Object.keys(nsp.in(socket.channelId).sockets);
            const userSockets = userSocketIds.map(
                id => nsp.in(socket.channelId).sockets[id].username
            );
            // Bots
            const botSocketIds = Object.keys(io.of("/bots").in(socket.channelId).sockets);
            const botSockets = botSocketIds.map(
                id => io.of("/bots").in(socket.channelId).sockets[id].username
            );

            // Emit the array of all usernames connected to users
            nsp.to(socket.channelId).emit("Members", [...userSockets, ...botSockets]);
            // Emit the array of all usernames connected to bots
            io.of("/bots").to(socket.channelId).emit("Members", {
                channel: channel.name,
                members: [...userSockets, ...botSockets]
            });

            // Emit that current user has left Channel
            nsp.to(socket.channelId).emit("alert", `${socket.username} has left the Channel.....`);
            io.of("/bots").to(socket.channelId).emit("alert", {
                channel: channel.name,
                body: `${socket.username} has left the Channel.....`
            });
        });
    });
};