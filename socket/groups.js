const { Chat, Group } = require("../models");
const { sanitizeMessage } = require("../utils/sanitize");

const rooms = []; // Stores active Rooms(with name same as Group ID)


module.exports = io => {
    io.on("connection", socket => {
        socket.on("data", async ({ url, username }) => {
            // Store the username in socket
            socket.username = username;

            // Extract chat ID from url
            socket.groupId = url.split("/")[2];

            // Add Socket to Room with name same as Group ID
            // Creates new Room if not exists
            socket.join(socket.groupId);

            // If room isn't present in rooms, add it
            if (rooms.indexOf(socket.groupId) == -1)
                rooms.push(socket.groupId);

            // Send old Messages to User
            try {
                // Find the group's Chats
                const group = await Group.findById(socket.groupId).populate("chat").exec();

                // Emit old messages to User
                socket.emit("Messages", group.chat.messages);

                // Remove unreadMessages of current user
                group.members.find(
                    ({ username }) => username === socket.username
                ).unreadMessages = 0;

                await group.save();

            } catch (err) {
                console.error(err.stack);
                throw err;
            }
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
                const group = await Group.findById(socket.groupId);

                // Push the new message in chat's messages
                await Chat.update(
                    { _id: group.chat },
                    { $push: { messages: message } }
                );

                // Emit the new chat to everyone in the room
                io.to(socket.groupId).emit("message", message);

                // Update unread messages of all other members in group
                const socketIds = Object.keys(io.in(socket.groupId).sockets);
                const sockets = socketIds.map(
                    id => io.in(socket.groupId).sockets[id].username
                );

                // Increment unreadMessages of each offline member
                group.members.forEach(member => {
                    if (sockets.indexOf(member.username) === -1) {
                        ++member.unreadMessages;
                    }
                });
                await group.save();

            } catch (err) {
                console.error(err.stack);
                throw err;
            }

        });


        // When User typed in Chat Box
        socket.on("typed", username => {
            // Emit username is typing message to others in room except socket
            socket.to(socket.groupId).broadcast.emit("typing", username);
        });
    });
};