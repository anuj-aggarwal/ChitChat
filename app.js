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

// USER CREATED FILES
// Passport
const Passport = require("./passport.js");

// Databases
const User = require("./models/users.js");
const Chatter = require("./models/chatters");
const Group = require("./models/groups");
const Chat = require("./models/chats");



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
mongoose.connect("mongodb://localhost:27017/chitchat", {
    useMongoClient: true
});



// --------------------
//  REQUIRED VARIABLES
// --------------------
var rooms = []; // Stores active Rooms(with name same as Chat ID)





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



//====================
//       ROUTES
//====================

// Post Request to '/' for SIGNUP
app.post('/signup', function (req, res, next) {
    // TODO: Add UserName Validation for same Users
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

    // Redirect Page back to Landing Page
    res.redirect('/');
});

// Post Request to '/login' for logging in
app.post('/login', Passport.authenticate('local', {
    failureRedirect: '/',   // Redirect to Home Page if Authentication Fails
    successRedirect: '/chats' // Redirect to User's Profile Page if Authentication Succeeds
}));



// Get Request for the Profile Page, showing all Chats
app.get('/chats', function (req, res) {
    // Find the current Chatter in chatters collection
    Chatter.findOne({
        username: req.user.username
    }).populate("chat").exec(function (err, chatter) {    // Populate the chats in the chatters collection
        if (err) throw err;
        // Find current User
        User.findAll({
            where: {
                username: chatter.username
            }
        }).then(function (users) {
            // Render chats.ejs with Current User's Name, current Chatter
            res.render("chats", {
                chatter: chatter,
                name: users[0].name
            });
        });
    });
});


// AJAX Get Request for getting Username
app.get("/details", function(req, res){
    res.send({
        username: req.user.username
    });
});


// Get Request for New Chat Form Page
app.get("/chats/new", function(req, res){
    // Find Current User
    User.findAll({
        where: {
            username: req.user.username
        }
    }).then(function(users){
        // Render newChat with Current User's Details
        res.render("newChat", {user: users[0]});
    });
});

// Get Request for Chat Page
app.get("/chats/:chatId", function (req, res) {
    // Find current Chatter
    Chatter.findOne({
        username: req.user.username
    },function (err, chatter) {
        if (err) throw err;

        // Find current User
        User.findAll({
            where: {
                username: chatter.username
            }
        }).then(function (users) {
            // Find Chat with Current Chat ID
            for (chat of chatter.chats) {
                if (chat.chat == req.params.chatId) {
                    // Render the chat page with Current Chat's Details
                    res.render("chat", {
                        chatter,
                        name: users[0].name,
                        title: chat.to
                    });
                }
            }
        });
    })

});

// Post Request to /chats to Add New Chat
app.post("/chats", function(req, res){
    // Find User with entered Username
    User.findAll({
        where:{
            username: req.body.username
        }
    }).then(function(users){
        // If user not found or Username same as current User, Fail
        if(users.length==0 || users[0].username==req.user.username){
            res.redirect("/chats/new");
        }
        else {
            // If User found successfully
            // Find current chatter
            Chatter.findOne({
                username: req.user.username
            }, function(err, chatter){
                // Find chats with entered username
                var chats = chatter.chats.filter(function(chat){
                    if(chat.to==req.body.username)
                        return true;
                    return false;
                });

                // If chat not found
                if(chats.length==0){
                    // Create new Chat between the two Chatters, redirect to Chat Page
                    createChat(req.user.username, req.body.username, function(chatId){
                        console.log(chatId);
                        // Redirect to Chat Page
                        res.redirect(`/chats/${chatId}`);
                    });
                }
                else{
                    // Redirect to Chat Page if Chat already exists
                    res.redirect(`/chats/${chats[0].chat}`);
                }
            });
        }
    });

    // Function to Create Chat between two Chatters
    // Returns Chat ID of newly created Chat as a parameter to Callback Function
    function createChat(sender, receiver, cb){
        // Create new empty Chat
        Chat.create({
            chat: []
        }, function(err, chat){
            if(err) throw err;
            // Find the current User
            Chatter.findOne({
                username: sender
            }, function(err, chatter){
                if(err) throw err;
                // Add new Chat to current User's Chats
                chatter.chats.push({
                    to: receiver,
                    isGroup: false,
                    chat: chat
                });
                chatter.save();
            });

            // Find the entered User
            Chatter.findOne({
                username: receiver
            }, function(err, chatter){
                if(err) throw err;
                // Add new Chat to entered User's Chats
                chatter.chats.push({
                    to: sender,
                    isGroup: false,
                    chat: chat
                });
                chatter.save();
            });

            // Call the Callback with new Chat's ID
            cb(chat._id);
        })
    }
});



// ====================
//      Sockets
// ====================

io.on("connection", function(socket){
    var chatId;

    // Receive URL from the User to extract Chat ID
    socket.on("url", function(url){
        // Extract Chat ID from URL
        var index = url.indexOf("/chats/");
        chatId = url.substr(index+7);

        // Add Socket to Room with name same as Chat ID
        // Creates new Room if not exists
        socket.join(chatId);

        // If room isn't present in rooms, add it
        if(rooms.indexOf(chatId)==-1)
            rooms.push(chatId);

        // Find the Chat with extracted Chat ID
        Chat.findOne({
            _id: chatId
        }, function(err, chats){
            if(err) throw err;

            // Emit old messages to the User
            socket.emit("Messages", chats.chat);
        });

    });

    // On receiving New message from User
    socket.on("new message", function(message){
        // Find the Chat
        Chat.findOne({
            _id:chatId
        }, function(err, chat){
            // Add the message to the Chat
            chat.chat.push({
                sender: message.sender,
                message: message.message
            });
            chat.save();

            // Emit the new chat to everyone in the room
            io.to(chatId).emit("message", message);
        })
    });
});








// MOUNTING STATIC FILES
app.use('/', function (req, res, next) {
    express.static(path.join(__dirname, "public_static"))(req, res, next);
});


// Listen at 3000
server.listen(3000, function () {
    console.log("Server Started");
});