const mongoose = require("mongoose");

var chatterSchema = mongoose.Schema({
    username: String,
    chats: [
        {
            to: String,
            isGroup: Boolean,
            chat: {
                type: mongoose.Schema.types.ObjectId,
                ref: "chat"
            }
        }
    ]
});

module.exports = mongoose.model("chatter", chatterSchema);