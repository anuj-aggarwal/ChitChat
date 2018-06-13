// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for Channel
const channelSchema = mongoose.Schema({
    name: String,
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


// Create and export Group model
module.exports = mongoose.model("channel", channelSchema);