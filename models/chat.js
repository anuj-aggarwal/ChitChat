// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for Chat
var chatSchema = mongoose.Schema({
    members: [
        {
            username: String,
            unreadMessages: Number
        }
    ],
    chat: [
        {
            sender: String,
            for: [String],  // Array of usernames whom to deliver this message
            message: String
        }
    ]
});

// Create and export Chat model
module.exports = mongoose.model("chat", chatSchema);