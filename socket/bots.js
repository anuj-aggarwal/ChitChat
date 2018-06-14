const { Bot } = require("../models");

module.exports = (io, bots) => {
    const nsp = io.of("/bots");
    nsp.on("connection", socket => {
        // Wait for Authentication Details from the Bot
        socket.on("auth data", async ({ username, secret }) => {
            // Check for Valid Credentials
            const bot = await Bot.findOne({ username, secret });

            if (bot === null) {
                // Bot not found!
                // Emit Authentication failure and disconnect the Bot
                socket.emit("auth error", "Invalid Credentials");
                socket.disconnect();
            }

            // Bot found
            // Emit Authenticated Event and add bot to bots Object
            socket.username = username;
            socket.emit("authenticated");
            bots[username] = socket;
        });
    });
};