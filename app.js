// -------------------------
// REQUIRED NODE MODULES
// -------------------------
// Path
const path = require("path");

// Express
const express = require("express");

// Sockets
const socketio = require("socket.io");
const http = require("http");

// Passport: Cookie Parser, Express-Session
const cp = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const passportSocketIo = require("passport.socketio");


// Connect Flash
const flash = require("connect-flash");


// USER CREATED FILES
// CONFIG
const CONFIG = require("./config");
// Passport
const Passport = require("./passport.js");
// Connect to Database
const mongoose = require("./db");


// --------------------
//    INITIALIZATION
// --------------------

// Create the Express App
const app = express();
// Extract Server from app
const server = http.Server(app);
// Initialize io
const io = socketio(server);



// Set EJS as View Engine
app.set("view engine", "ejs");


//====================
//     VARIABLES
//====================
const bots = {};    // Stores { BotUsername : BotSocket }
const channels = {};    // Stores { ChannelID : { name: channelName, chat: channelChatId } }


//====================
//    MIDDLEWARES
//====================

// Parse Request's Body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Initialize Express-session
app.use(cp(CONFIG.COOKIE_SECRET));

// Session Store
const sessionStore = new MongoStore({ mongooseConnection: mongoose.connection });
app.use(session({
    secret: CONFIG.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore
}));

// Initialize Passport
app.use(Passport.initialize());
app.use(Passport.session());

// Initialize Flash
app.use(flash());


// MOUNTING STATIC FILES
app.use("/", express.static(path.join(__dirname, "public_static")));


// Add user to response's locals
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});


// USING ROUTERS
app.use("/", require("./routes")(io, bots));



// ====================
//      Sockets
// ====================

// Authentication
const authenticator = passportSocketIo.authorize({
    cookieParser: cp,
    secret: CONFIG.SESSION_SECRET,
    store: sessionStore,
});

// Use Authenticator to authenticate users on all three Namespaces
io.of("/chats").use(authenticator);
io.of("/groups").use(authenticator);
io.of("/channels").use(authenticator);

// Add Event Listeners to all Namespaces
require("./socket/chats")(io, bots);
require("./socket/groups")(io);
require("./socket/channels")(io, channels);
require("./socket/bots")(io, bots, channels);


// Listen at PORT specified in CONFIG
server.listen(CONFIG.SERVER.PORT, () => {
    console.log("Server Started");
});
