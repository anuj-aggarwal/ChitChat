// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for Channel
const channelSchema = mongoose.Schema({
    name: String,
    members: [String],  // Array of usernames of members
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chat"
    }
});

// Define findByName for Channel
channelSchema.statics.findByName = function (name) {
    // Arrow Function not used implicitly to preserve this binding
    return this.findOne({ name });
};

// Defining findByChatId for Channel
channelSchema.statics.findByChatId = function (chatId) {
    // Arrow Function not used implicitly to preserve this binding
    return this.findOne({ chat: chatId });
};


// Create and export Group model
module.exports = mongoose.model("channel", channelSchema);