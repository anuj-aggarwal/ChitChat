// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for Chatter
var chatterSchema = mongoose.Schema({
    username: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    chats: [
        {
            to: String,
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


// Define findByUsername for Chatter
chatterSchema.statics.findByUsername = function(username, cb){
    this.findOne({
        username
    }, cb);
};


// Create and export Chatter model
module.exports = mongoose.model("chatter", chatterSchema);