// Import all DB Models
const User = require("./user");
const Chatter = require("./chatter");
const Chat = require("./chat");
const Group = require("./group");
const Channel = require("./channel");

// Export all the models
module.exports = { User, Chatter, Chat, Group, Channel };