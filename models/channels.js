// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for Channel
var channelSchema = mongoose.Schema({
    name: String,
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chat"
    }
});


// Define findByName for Channel
channelSchema.statics.findByName = function(name, cb){
    this.findOne({
        name
    }, cb);
};

// Defining findByChatId for Channel
channelSchema.statics.findByChatId = function(chatId, cb) {
    this.findOne({
        chat: chatId
    }, cb);
};


// Create and export Group model
module.exports = mongoose.model("channel", channelSchema);