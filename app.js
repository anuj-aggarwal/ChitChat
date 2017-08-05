// -------------------------
// REQUIRED NODE MODULES
// -------------------------
// Path
const path = require("path");

// Express
const express = require("express");
const bodyParser = require("body-parser");

// Sockets
const socketio = require("socket.io");
const http = require("http");

// Passport: Cookie Parser, Express-Session
const cp = require("cookie-parser");
const session = require("express-session");

// Mongoose
const mongoose = require("mongoose");

// HTML Sanitizer
const sanitizeHTML = require("sanitize-html");

// USER CREATED FILES
// Passport
const Passport = require("./passport.js");

// Databases
const User = require("./models/users.js");
const Chatter = require("./models/chatters");
const Group = require("./models/groups");
const Channel = require("./models/channels");
const Chat = require("./models/chats");

// Routers
var routes = {
    chats: require("./routes/chats"),
    groups: require("./routes/groups"),
    channels: require("./routes/channels")
};



// --------------------
//    INITIALIZATION
// --------------------

// Create the Express App
const app = express();
// Extract Server from app
const server = http.Server(app);
// Initialize io
const io = socketio(server);

// Connect to MongoDB Database
mongoose.connect("mongodb://DeveloperSpace:DeveloperSpace%40123@ds135963.mlab.com:35963/chitchat", {
    useMongoClient: true
});


// --------------------
//  REQUIRED VARIABLES
// --------------------
var rooms = []; // Stores active Rooms(with name same as Chat ID)
var allowedTags = ["b", "i", "br", "a", "strong", "em"];


// Set EJS as View Engine
app.set("view engine", "ejs")


//====================
//    MIDDLEWARES
//====================

// Use Body Parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Initialize Express-session
app.use(cp('Secret Key'));
app.use(session({
    secret: 'Secret Key',
    resave: false,
    saveUninitialized: true
}));

// Initialize Passport
app.use(Passport.initialize());
app.use(Passport.session());



// MOUNTING STATIC FILES
app.use('/', express.static(path.join(__dirname, "public_static")));

// Check Logged In before any get request
function checkLoggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect("/");
    }
}

app.get("*", checkLoggedIn);


//====================
//       ROUTES
//====================

// Post Request to '/' for SIGNUP
app.post('/signup', function (req, res, next) {

    // Find if Username already taken
    User.findByUsername(req.body.username).then(function (user) {
        // If username exists already, do nothing
        if (user === null) {
            // Create a New User with entered details
            User.create({
                username: req.body.username,
                password: req.body.password,
                email: req.body.email,
                name: req.body.firstName + " " + req.body.lastName
            });

            // Create a chatter with the username, no Chats
            Chatter.create({
                username: req.body.username,
                chats: []
            });
        }

        // Redirect Page back to Landing Page
        res.redirect('/');
    });
});

// Post Request to '/login' for logging in
app.post('/login', Passport.authenticate('local', {
    failureRedirect: '/',   // Redirect to Home Page if Authentication Fails
    successRedirect: '/chats' // Redirect to User's Profile Page if Authentication Succeeds
}));

// Get Request for Logging Out
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// AJAX Get Request for getting Username
app.get("/details", checkLoggedIn, function (req, res) {
    res.send({
        username: req.user.username
    });
});



// USING ROUTERS
// Chats Route
app.use("/chats", routes.chats);

// Groups Route
app.use("/groups", routes.groups);

// Channels Route
app.use("/channels", routes.channels);



// Redirect to Home Page if Request for a non-existing Page
app.get("*", function (req, res) {
    res.redirect("/");
});




// ====================
//      Sockets
// ====================

io.on("connection", function (socket) {
    var chatId;
    var url;
    var isChannel;
    var username;

    // Receive Data from the User,
    // Send old Messages(Private Chat) and Members(Channel)
    socket.on("data", function (data) {
        url = data.url;
        isChannel = data.isChannel;
        username = data.username;

        // Extract Chat ID from URL
        if (isChannel) {
            var index = url.indexOf("/channels/");
            chatId = url.substr(index + 10);
        }
        else {
            var index = url.indexOf("/chats/");
            chatId = url.substr(index + 7);
        }

        // Add Socket to Room with name same as Chat ID
        // Creates new Room if not exists
        socket.join(chatId);

        // If room isn't present in rooms, add it
        if (rooms.indexOf(chatId) == -1)
            rooms.push(chatId);

        // If its Channel, Send all Members to User
        if (isChannel) {
            // Find current Channel(Channel with chat as chatId)
            Channel.findByChatId(chatId, function (err, channel) {
                if (err) throw err;

                // Add current Chatter to Channel's Members
                channel.members.push(username);
                channel.save();

                // Emit Members to User
                io.to(chatId).emit("Members", channel.members);
            });
        }
        else {
            // else, Send old Messages to User

            // Find Chat with Extracted Chat ID
            Chat.findById(chatId, function (err, chat) {
                if (err) throw err;

                // Emit old messages to User
                socket.emit("Messages", chat.chat);
            });
        }

    });

    // On receiving New message from User
    socket.on("new message", function (message) {
        // Sanitize the Message
        message.message = sanitizeHTML(message.message, {allowedTags});
        // Trim the message for Starting and Ending Whitespaces
        message.message = message.message.trim();


        message.for = [];
        // Check for a Whisper
        if (message.message != "" && message.message[0] == '@') {
            message.message = message.message.slice(1);
            var messageArray = message.message.split(":");
            message.for.push(messageArray[0].trim());
            message.for.push(message.sender);
            message.message = messageArray.slice(1).join(":");
        }

        // Don't add Empty Messages
        if (message.message !== "") {

            // Find the Chat
            Chat.findById(chatId, function (err, chat) {
                // Add the message to the Chat
                chat.chat.push(message);
                chat.save();

                // Emit the new chat to everyone in the room
                io.to(chatId).emit("message", message);
            })
        }
    });


    // When User typed in Chat Box
    socket.on("typed", function(username){
        // Emit username is typing message
        // to everyone in room except socket
        socket.to(chatId).broadcast.emit("typing", username);
    });

    // Remove User from Members of Channel on leaving
    socket.on("disconnect", function () {
        if (isChannel) {
            // Find current Channel
            Channel.findByChatId(chatId, function (err, channel) {
                if (err) throw err;

                // Find left user's username in channel's members
                var userIndex = channel.members.indexOf(username);
                channel.members.splice(userIndex, 1);
                channel.save();

                io.to(chatId).emit("Members", channel.members);
            });
        }
    })
});



// Listen at process.env.PORT OR 3000
server.listen(process.env.PORT || 3000, function () {
    console.log("Server Started");
});