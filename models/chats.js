const mongoose = require("mongoose");

var chatSchema = mongoose.Schema({
    chat: [
        {
            for: [String],
            message: String
        }
    ]
});

module.exports = mongoose.model("chat", chatSchema);