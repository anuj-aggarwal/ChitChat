// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for Chat
var chatSchema = mongoose.Schema({
    chat: [
        {
            for: [String],  // Array of usernames whom to deliver this message
            message: String
        }
    ]
});

// Create and export Chat model
module.exports = mongoose.model("chat", chatSchema);