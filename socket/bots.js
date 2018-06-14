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
            socket.emit("authenticated");

            // Add bot name in socket and all chats IDs
            socket.username = username;
            socket.chats = bot.chats.reduce((acc, chat) => {
                acc[chat.to] = chat.id;
                return acc;
            }, {});

            // Add Bot to all chats' rooms
            bot.chats.forEach(({ to }) => {
                socket.join(to);
            });

            bots[username] = socket;
            console.log(bots[username]);
            setInterval(() => console.log(bots[username]), 5000);
        });


        socket.on("disconnect", () => {
            delete bots[socket.username];
        });
    });
};