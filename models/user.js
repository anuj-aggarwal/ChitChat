// Require Mongoose
const mongoose = require("mongoose");

// Create Schema for User
var userSchema = mongoose.Schema({
	username: String,
	password: String,
	name: String,
	email: String
});

// Define findByUsername for User
userSchema.statics.findByUsername = function(username) {
	return this.findOne({ username });
};

// Create and export User model
module.exports = mongoose.model("user", userSchema);