const route = require("express").Router();

route.use("/chats", require("./chats"));
route.use("/groups", require("./groups"));
route.use("/channels", require("./channels"));

// Export current Route
module.exports = route;