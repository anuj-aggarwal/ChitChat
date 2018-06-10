// Mongoose
const mongoose = require("mongoose");

// CONFIG
const CONFIG = require("./config");

// Connect to MongoDB Database
mongoose.connect(`mongodb://${CONFIG.DB.USERNAME}:${CONFIG.DB.PASSWORD}@${CONFIG.DB.HOST}:${CONFIG.DB.PORT}/${CONFIG.DB.NAME}`)
    .then(() => {
        console.log("Database Ready for use!");
    })
    .catch(err => {
        console.error("Error connecting to Database!!");
        console.error(err.stack);
    });

// Export the mongoose connection
module.exports = mongoose;