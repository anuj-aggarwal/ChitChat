// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for Group
const groupSchema = mongoose.Schema({
    name: String,
    members: [{
        username: String,
        unreadMessages: Number
    }],
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chat"
    }
});

// Define findByName for Group
groupSchema.statics.findByName = function (name) {
    // Arrow Function not used implicitly to preserve this binding
    return this.findOne({ name });
};

// Create and export Group model
module.exports = mongoose.model("group", groupSchema);