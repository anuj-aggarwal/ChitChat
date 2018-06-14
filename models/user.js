// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for User
const userSchema = mongoose.Schema({
	username: String,
	password: String,
	name: String,
	email: String,
	chats: [{
		to: String,	// Username of other User
		chat: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "chat"
		},
		unreadMessages: Number
	}],
	groups: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "group"
	}],
    favouriteChannels: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "channel"
	}],
	bots: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "bot"
	}]
});

// Define findByUsername for User
userSchema.statics.findByUsername = function (username) {
    // Arrow Function not used implicitly to preserve this binding
	return this.findOne({ username });
};

// Create and export User model
module.exports = mongoose.model("user", userSchema);