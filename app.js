// REQUIRING NECESSARY NODE MODULES
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

// Create the Express App
const app = express();

const socketio = require("socket.io");
const http = require("http");
const server = http.Server(app);
const io = socketio(server);

const cp = require("cookie-parser");
const session = require("express-session");
const Passport = require("./passport.js");


const mongoose = require("mongoose");

const User = require("./models/users.js");
const Chatter = require("./models/chatters");
const Group = require("./models/groups");
const Chat = require("./models/chats");


var rooms = [];
var users = {};

// Connect to MongoDB Database
mongoose.connect("mongodb://localhost:27017/chitchat", {
    useMongoClient: true
});


// Set EJS as View Engine
app.set("view engine", "ejs")

// function seedChatters(){
//     Chatter.create({
//         username: "Anuj005",
//         chat: []
//     });
//     Chatter.create({
//         username: "Dev",
//         chat: []
//     });
// }
// seedChatters();

//====================
//    MIDDLEWARES
//====================

app.use(cp('Secret Key'));
app.use(session({
    secret: 'Secret Key',
    resave: false,
    saveUninitialized: true
}));


// Use Body Parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


// Initialize Passport
app.use(Passport.initialize());
app.use(Passport.session());


//====================
//       ROUTES
//====================

// Post Request to '/' for SIGNUP
app.post('/', function (req, res, next) {
    // TODO: Add UserName Validation for same Users
    // Create a New User with entered details
    User.create({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        name: req.body.firstName + " " + req.body.lastName
    });
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

// Get Request for the Profile Page
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


app.get("/chat", function (req, res) {
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
            res.render("chat", {
                chatter: chatter,
                name: users[0].name
            });
        });
    });
});

app.get("/details", function(req, res){
    res.send({
        username: req.user.username
    });
});


app.get("/chats/new", function(req, res){
    User.findAll({
        where: {
            username: req.user.username
        }
    }).then(function(users){
        res.render("newChat", {user: users[0]});
    });
});

app.get("/chats/:chatId", function (req, res) {
    Chatter.findOne({
        username: req.user.username
    },function (err, chatter) {
        if (err) throw err;

        User.findAll({
            where: {
                username: chatter.username
            }
        }).then(function (users) {
            for (chat of chatter.chats) {
                if (chat.chat == req.params.chatId) {
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

app.post("/chats", function(req, res){
    User.findAll({
        where:{
            username: req.body.username
        }
    }).then(function(users){
        if(users.length==0 || users[0].username==req.user.username){
            res.redirect("/chats/new");
        }
        else {
            Chatter.findOne({
                username: req.user.username
            }, function(err, chatter){
                var chats = chatter.chats.filter(function(chat){
                    if(chat.to==req.body.username)
                        return true;
                    return false;
                });
                if(chats.length==0){
                    createChat(req.user.username, req.body.username, function(chatId){
                        console.log(chatId);
                        res.redirect(`/chats/${chatId}`);
                    });
                }
                else{
                    res.redirect(`/chats/${chats[0].chat}`);
                }
            });
        }
    });

    function createChat(sender, receiver, cb){
        Chat.create({
            chat: []
        }, function(err, chat){
            if(err) throw err;
            Chatter.findOne({
                username: sender
            }, function(err, chatter){
                if(err) throw err;
                chatter.chats.push({
                    to: receiver,
                    isGroup: false,
                    chat: chat
                });
                chatter.save();
            });
            Chatter.findOne({
                username: receiver
            }, function(err, chatter){
                if(err) throw err;
                chatter.chats.push({
                    to: sender,
                    isGroup: false,
                    chat: chat
                });
                chatter.save();
            });
            cb(chat._id);
        })
    }
});

// ====================
//      Sockets
// ====================

io.on("connection", function(socket){
    var chatId;

    socket.on("url", function(url){
        var index = url.indexOf("/chats/");
        chatId = url.substr(index+7);
        socket.join(chatId);
        if(rooms.indexOf(chatId)==-1)
            rooms.push(chatId);

        Chat.findOne({
            _id: chatId
        }, function(err, chats){
            if(err) throw err;

            socket.emit("Messages", chats.chat);
        });

    });

    socket.on("new message", function(message){
        Chat.findOne({
            _id:chatId
        }, function(err, chat){
            chat.chat.push({
                sender: message.sender,
                message: message.message
            });
            console.log(chat);
            chat.save();
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