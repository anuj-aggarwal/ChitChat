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
var allowedTags = ["b", "i", "br", "a", "strong", "em"];


// Set EJS as View Engine
app.set("view engine", "ejs")


//====================
//    MIDDLEWARES
//====================

function checkLoggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.redirect("/");
    }
}


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

// Get Request for Logging Out
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// Get Request for the Profile Page, showing all Chats
app.get('/chats', checkLoggedIn, function (req, res) {
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
app.get("/details", checkLoggedIn, function (req, res) {
    res.send({
        username: req.user.username
    });
});


// Get Request for New Chat Form Page
app.get("/chats/new", checkLoggedIn, function (req, res) {
    // Find Current User
    User.findAll({
        where: {
            username: req.user.username
        }
    }).then(function (users) {
        // Render newChat with Current User's Details
        res.render("newChat", {user: users[0]});
    });
});

// Get Request for Chat Page
app.get("/chats/:chatId", checkLoggedIn, function (req, res) {
    // Find current Chatter
    Chatter.findOne({
        username: req.user.username
    }, function (err, chatter) {
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
                    break;
                }
            }
        });
    })

});

// Post Request to /chats to Add New Chat
app.post("/chats", function (req, res) {
    // Find User with entered Username
    User.findAll({
        where: {
            username: req.body.username
        }
    }).then(function (users) {
        // If user not found or Username same as current User, Fail
        if (users.length == 0 || users[0].username == req.user.username) {
            res.redirect("/chats/new");
        }
        else {
            // If User found successfully
            // Find current chatter
            Chatter.findOne({
                username: req.user.username
            }, function (err, chatter) {
                // Find chats with entered username
                var chats = chatter.chats.filter(function (chat) {
                    if (chat.to == req.body.username)
                        return true;
                    return false;
                });

                // If chat not found
                if (chats.length == 0) {
                    // Create new Chat between the two Chatters, redirect to Chat Page
                    createChat(req.user.username, req.body.username, function (chatId) {
                        console.log(chatId);
                        // Redirect to Chat Page
                        res.redirect(`/chats/${chatId}`);
                    });
                }
                else {
                    // Redirect to Chat Page if Chat already exists
                    res.redirect(`/chats/${chats[0].chat}`);
                }
            });
        }
    });

    // Function to Create Chat between two Chatters
    // Returns Chat ID of newly created Chat as a parameter to Callback Function
    function createChat(sender, receiver, cb) {
        // Create new empty Chat
        Chat.create({
            chat: []
        }, function (err, chat) {
            if (err) throw err;
            // Find the current User
            Chatter.findOne({
                username: sender
            }, function (err, chatter) {
                if (err) throw err;
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
            }, function (err, chatter) {
                if (err) throw err;
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

// Get Request for New Group Page
app.get("/groups/new", checkLoggedIn, function (req, res) {
    // Find Current User
    User.findAll({
        where: {
            username: req.user.username
        }
    }).then(function (users) {
        // Render newGroup with Current User's Details
        res.render("newGroup", {user: users[0]});
    });
});


// Post Request for Creating New Group
app.post("/groups/new", function (req, res) {
    // Check if Group Name is Already present
    Group.find({
        name: req.body.groupName
    }, function (err, groups) {
        if (err) throw err;

        // If Group is already present
        if (groups.length != 0) {
            res.redirect("/groups/new");
        }
        else {
            // If Group is not Present

            // Find current Chatter
            Chatter.findOne({
                username: req.user.username
            }, function (err, chatter) {
                if (err) throw err;
                // Create Chat for new Group
                Chat.create({
                    chat: []
                }, function (err, chat) {
                    if (err) throw err;

                    // Create the New Group
                    Group.create({
                        name: req.body.groupName,
                        members: [chatter._id],
                        chat: chat
                    });

                    // Add new chat to Current Chatter
                    chatter.chats.push({
                        to: req.body.groupName,
                        isGroup: true,
                        chat: chat._id
                    });
                    chatter.save();

                    // Redirect User to New Chat Page
                    res.redirect(`/chats/${chat._id}`);

                });


            });
        }
    });
});

// Get Request for Join Group Page
app.get("/groups", checkLoggedIn, function (req, res) {
    // Find Current User
    User.findAll({
        where: {
            username: req.user.username
        }
    }).then(function (users) {
        // Render newChat with Current User's Details
        res.render("joinGroup", {user: users[0]});
    });
});

// Post Request for Joining Group
app.post("/groups", function (req, res) {
    // Find group with entered Group Name
    Group.findOne({
        name: req.body.groupName
    }, function (err, group) {
        if (err) throw err;

        // If Group not found
        if (group == null) {
            res.redirect("/groups");
        }
        else {
            // If Group present
            // Find current Chatter
            Chatter.findOne({
                username: req.user.username
            }, function (err, chatter) {
                if (err) throw err;

                // Add Chatter to Group Members if not already present
                if (group.members.indexOf(chatter._id) == -1) {
                    group.members.push(chatter._id);
                    group.save();
                }


                // Add Group Chat to Chatter's Chats if not already present
                if (chatter.chats.filter(function (chat) {
                        if (chat.chat.toString() == group.chat.toString())
                            return true;
                        return false;
                    }).length == 0) {

                    chatter.chats.push({
                        to: group.name,
                        isGroup: true,
                        chat: group.chat
                    });
                    chatter.save();
                }

                res.redirect(`/chats/${group.chat}`);

            });
        }
    });
});

// Get Request for Create Channel Page
app.get("/channels/new", checkLoggedIn, function (req, res) {
    // Find Current User
    User.findAll({
        where: {
            username: req.user.username
        }
    }).then(function (users) {
        // Render newChannel with Current User's Details
        res.render("newChannel", {user: users[0]});
    });
});

// Post Request for Creating New Channel
app.post("/channels/new", function (req, res) {
    // Check if Channel Name is Already present
    Channel.findOne({
        name: req.body.channelName
    }, function (err, channel) {
        if (err) throw err;

        // If Channel is already present
        if (channel != null) {
            res.redirect("/channels/new");
        }
        else {
            // If Channel is not Present

            // Create Chat for new Channel
            Chat.create({
                chat: []
            }, function (err, chat) {
                if (err) throw err;

                // Create the New Channel
                Channel.create({
                    name: req.body.channelName,
                    members: [],
                    chat: chat
                });

                // Redirect User to New Chat Page
                res.redirect(`/channels/${chat._id}`);

            });


        }
    });
});

// Get Request for Joining Channel Page
app.get("/channels", checkLoggedIn, function (req, res) {
    // Find Current User
    User.findAll({
        where: {
            username: req.user.username
        }
    }).then(function (users) {
        // Render newChannel with Current User's Details
        res.render("joinChannel", {user: users[0]});
    });
});

// Post Request for Joining Channel
app.post("/channels", function (req, res) {
    // Find channel with entered Channel Name
    Channel.findOne({
        name: req.body.channelName
    }, function (err, channel) {
        if (err) throw err;

        // If Channel not found
        if (channel == null) {
            res.redirect("/channels");
        }
        else {
            // Redirect to Chat's Page
            res.redirect(`/channels/${channel.chat}`);
        }
    });
});

// Get Request for Channel Page
app.get("/channels/:chatId", checkLoggedIn, function (req, res) {
    console.log(req.params.chatId);
    // Find current User
    User.findAll({
        where: {
            username: req.user.username
        }
    }).then(function (users) {
        // Find Channel with Current Chat ID
        Channel.findOne({
            chat: req.params.chatId
        }, function (err, channel) {
            if (err) throw err;

            // Find the current Chatter
            Chatter.findOne({
                username: req.user.username
            }, function(err, chatter){
                if(err) throw err;

                // Check if Channel is in favourite Channels of current Chatter
                if(chatter.favouriteChannels.indexOf(channel.name)==-1){
                    // Render the Channel Page with favourite false
                    res.render("channel", {
                        user: users[0],
                        title: channel.name,
                        favourite: false
                    });
                }
                else{
                    // Render the Channel Page with favourite true
                    res.render("channel", {
                        user: users[0],
                        title: channel.name,
                        favourite: true
                    });
                }


            });
        });
    });


});

// Post Request for Adding Channel to Favourite Channels
app.post("/channels/fav", function(req, res){
    // Search for current Chatter
    Chatter.findOne({
        username: req.user.username
    }, function(err, chatter){
        if(err) throw err;

        // Check if Channel is already in favourite Channels of Chatter
        var channelIndex = chatter.favouriteChannels.indexOf(req.body.channelName);

        if(channelIndex==-1){
            // Channel not found
            // Add to favourite Channels
            chatter.favouriteChannels.push(req.body.channelName);
            chatter.save();

            // Send true to User as Channel is now Favourite
            res.send(true);
        }
        else {
            // Channel already in favourite Channels
            // Remove from favourite Channels
            chatter.favouriteChannels.splice(channelIndex, 1);
            chatter.save();

            // Send false to User as Channel is not Favourite now
            res.send(false);
        }
    });
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
            Channel.findOne({
                chat: chatId
            }, function (err, channel) {
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
            Chat.findOne({
                _id: chatId
            }, function (err, chats) {
                if (err) throw err;

                // Emit old messages to User
                socket.emit("Messages", chats.chat);
            });
        }

    });

    // On receiving New message from User
    socket.on("new message", function (message) {
        // Sanitize the Message
        message.message = sanitizeHTML(message.message, {allowedTags});
        // Trim the message for Starting and Ending Whitespaces
        message.message = message.message.trim();

        // Don't add Empty Messages
        if (message.message !== "") {
            // Find the Chat
            Chat.findOne({
                _id: chatId
            }, function (err, chat) {
                // Add the message to the Chat
                chat.chat.push({
                    sender: message.sender,
                    message: message.message
                });
                chat.save();

                // Emit the new chat to everyone in the room
                io.to(chatId).emit("message", message);
            })
        }
    });

    // Remove User from Members of Channel on leaving
    socket.on("disconnect", function () {
        if (isChannel) {
            // Find current Channel
            Channel.findOne({
                chat: chatId
            }, function (err, channel) {
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


// MOUNTING STATIC FILES
app.use('/', express.static(path.join(__dirname, "public_static")));

app.get("*", function (req, res) {
    res.redirect("/");
});


// Listen at 3000
server.listen(3000, function () {
    console.log("Server Started");
});