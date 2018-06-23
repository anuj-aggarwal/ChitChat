// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for Bot
const botSchema = mongoose.Schema({
    username: String,   // Name of Bot
    secret: String,
    chats: [{
		to: String,	// Username of User
		chat: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "chat"
		},
		unreadMessages: Number
    }]
});

// Define findByName for Bot
botSchema.statics.findByUsername = function (username) {
	// Arrow Function not used implicitly to preserve this binding
	return this.findOne({ username });
};


// Create and export Bot model
module.exports = mongoose.model("bot", botSchema);