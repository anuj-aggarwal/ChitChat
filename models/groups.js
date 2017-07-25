const mongoose = require("mongoose");

var groupSchema = mongoose.Schema({
    name: String,
    members: [String],
    chat: {
        type: mongoose.Schema.types.ObjectId,
        ref: "chat"
    }
});

module.exports = mongoose.model("group", groupSchema);