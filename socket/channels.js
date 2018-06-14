const { Chat, Channel } = require("../models");
const { sanitizeMessage } = require("../utils/sanitize");

const rooms = []; // Stores active Rooms(with name same as Channel ID)


module.exports = io => {
    const nsp = io.of("/channels");
    nsp.on("connection", socket => {
        socket.on("data", async ({ url, username }) => {
            // Store the username in socket
            socket.username = username;

            // Extract chat ID from url
            socket.channelId = url.split("/")[2];

            // Add Socket to Room with name same as Channel ID
            // Creates new Room if not exists
            socket.join(socket.channelId);

            // If room isn't present in rooms, add it
            if (rooms.indexOf(socket.channelId) === -1)
                rooms.push(socket.channelId);

            // Emit the new Chat members
            // Find clients connected in the Channel's Room
            const socketIds = Object.keys(nsp.in(socket.channelId).sockets);
            const sockets = socketIds.map(
                id => nsp.in(socket.channelId).sockets[id].username
            );

            // Emit the array of all usernames connected
            nsp.to(socket.channelId).emit("Members", sockets);
            // Emit that current user has joined Channel
            nsp.to(socket.channelId).emit("alert", `${socket.username} has joined the Channel.....`);

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
                const channel = await Channel.findById(socket.channelId);

                // Push the new message in chat's messages
                await Chat.update(
                    { _id: channel.chat },
                    { $push: { messages: message } }
                );

                // Emit the new chat to everyone in the room
                nsp.to(socket.channelId).emit("message", message);

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
        socket.on("disconnect", () => {
            // Emit the new Chat members

            // Find clients connected in the Channel's Room
            const socketIds = Object.keys(nsp.in(socket.channelId).sockets);
            const sockets = socketIds.map(
                id => nsp.in(socket.channelId).sockets[id].username
            );

            // Emit the array of all usernames connected
            nsp.to(socket.channelId).emit("Members", sockets);
            // Emit that current user has joined Channel
            nsp.to(socket.channelId).emit("alert", `${socket.username} has left the Channel.....`);
        });
    });
};