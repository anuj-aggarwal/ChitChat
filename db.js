// Mongoose
const mongoose = require("mongoose");

// CONFIG
const CONFIG = require("./config");

// Connect to MongoDB Database
mongoose.connect(`mongodb://${CONFIG.DB.USERNAME}:${CONFIG.DB.PASSWORD}@${CONFIG.DB.HOST}:${CONFIG.DB.PORT}/${CONFIG.DB.NAME}`, function (err) {
    if (err) throw err;

    console.log("Database Ready for use!");
});

// Export the mongoose connection
module.exports = mongoose;