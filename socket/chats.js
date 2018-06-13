const { Chat, User } = require("../models");
const { sanitizeMessage } = require("../utils/sanitize");

const rooms = []; // Stores active Rooms(with name same as Chat ID)


module.exports = io => {
    io.on("connection", socket => {
        socket.on("data", async ({ url, username }) => {
            // Store the username in socket
            socket.username = username;

            // Extract chat ID from url
            socket.chatId = url.split("/")[2];

            // Find current user
            const user = await User.findByUsername(socket.username);
            // Find the current chat
            const userChat = user.chats.find(
                chat => chat.chat.equals(socket.chatId)
            );
            // Store the receiver in socket
            socket.receiver = userChat.to;

            // Add Socket to Room with name same as Chat ID
            // Creates new Room if not exists
            socket.join(socket.chatId);

            // If room isn't present in rooms, add it
            if (rooms.indexOf(socket.chatId) === -1)
                rooms.push(socket.chatId);

            // Send old Messages to User
            try {
                // Find Chat with Extracted Chat ID
                const chat = await Chat.findById(socket.chatId);

                // Emit old messages to User
                socket.emit("Messages", chat.messages);

                // Remove unreadMessages of current user
                userChat.unreadMessages = 0;
                await user.save();
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
                body: text
            };

            try {
                // Push the new message in chat's messages
                await Chat.update(
                    { _id: socket.chatId },
                    { $push: { messages: message } }
                );

                // Emit the new chat to everyone in the room
                io.to(socket.chatId).emit("message", message);

                // Update the unread Messages of receiver if receiver not connected
                const socketIds = Object.keys(io.in(socket.chatId).sockets);
                const sockets = socketIds.map(
                    id => io.in(socket.chatId).sockets[id]
                );

                if (!sockets.find(socket => socket.username === socket.receiver)) {
                    // Receiver is not connected

                    // Increment receiver's unread Messages
                    const receiver = await User.findByUsername(socket.receiver);
                    ++receiver.chats.find(
                        chat => chat.chat.equals(socket.chatId)
                    ).unreadMessages;

                    await receiver.save();
                }

            } catch (err) {
                console.error(err.stack);
                throw err;
            }

        });


        // When User typed in Chat Box
        socket.on("typed", username => {
            // Emit username is typing message to others in room except socket
            socket.to(socket.chatId).broadcast.emit("typing", username);
        });
    });
};
