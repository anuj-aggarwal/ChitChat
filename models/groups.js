// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for Group
var groupSchema = mongoose.Schema({
    name: String,
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chat"
    }
});

// Create and export Group model
module.exports = mongoose.model("group", groupSchema);