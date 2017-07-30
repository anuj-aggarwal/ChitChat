// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for Chatter
var chatterSchema = mongoose.Schema({
    username: String,
    chats: [
        {
            to: String,
            isGroup: Boolean,
            chat: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "chat"
            }
        }
    ],
    favouriteChannels: [String] // Array of Names of Favourite Channels
});

// Create and export Chatter model
module.exports = mongoose.model("chatter", chatterSchema);