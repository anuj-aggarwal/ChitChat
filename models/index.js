// Import all DB Models
const User = require("./user");
const Bot = require("./bot");
const Chat = require("./chat");
const Group = require("./group");
const Channel = require("./channel");

// Export all the models
module.exports = { User, Bot, Chat, Group, Channel };