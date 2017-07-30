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
    favouriteChannels: [
        {
            name: String,
            chat: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "chat"
            }
        }
    ]
});

// Create and export Chatter model
module.exports = mongoose.model("chatter", chatterSchema);