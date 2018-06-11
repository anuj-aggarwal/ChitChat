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


// HTML Sanitizer
const sanitizeHTML = require("sanitize-html");

// Connect Flash
const flash = require("connect-flash");

// Bcrypt
const bcrypt = require("bcrypt");


// USER CREATED FILES
// CONFIG
const CONFIG = require("./config");
// Passport
const Passport = require("./passport.js");
// Connect to Database
require("./db");

// Databases
const { User, Chat } = require("./models");


// --------------------
//    INITIALIZATION
// --------------------

// Create the Express App
const app = express();
// Extract Server from app
const server = http.Server(app);
// Initialize io
const io = socketio(server);


// --------------------
//  REQUIRED VARIABLES
// --------------------
const rooms = []; // Stores active Rooms(with name same as Chat ID)
const allowedTags = ["b", "i", "br", "a", "strong", "em"];


// Set EJS as View Engine
app.set("view engine", "ejs");


//====================
//    MIDDLEWARES
//====================

// Parse Request's Body
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Initialize Express-session
app.use(cp(CONFIG.COOKIE_SECRET));
app.use(session({
    secret: CONFIG.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Initialize Passport
app.use(Passport.initialize());
app.use(Passport.session());

// Initialize Flash
app.use(flash());


// MOUNTING STATIC FILES
app.use('/', express.static(path.join(__dirname, "public_static")));


// Add user to response's locals
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});


// Get Route for Home Page
app.get("/", (req, res) => {
    res.render("index", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Check Logged In before any get request
function checkLoggedIn(req, res, next) {
    if (req.user) {
        next();
    } else {
        req.flash("error", "You must be Logged in to do that!");
        res.redirect("/");
    }
}

app.get("*", checkLoggedIn);


//====================
//       ROUTES
//====================

// Post Request to '/' for SIGNUP
app.post('/signup', async (req, res, next) => {
    try {
        // Find if Username already taken
        let user = await User.findByUsername(req.body.username);

        // If username exists already
        if (user !== null) {
            req.flash("error", `Username ${req.body.username} already in use!`);
            return res.redirect("/");
        }
        
        // Username does not exists
        // Generate Hashed Password
        const hash = await bcrypt.hash(req.body.password, 5);

        // Create a New User with entered details, Hashed Password and other defaults
        user = await User.create({
            username: req.body.username,
            password: hash,
            name: req.body.firstName + " " + req.body.lastName,
            email: req.body.email,
            chats: [],
            groups: [],
            favouriteChannels: []
        });

        // Redirect User back to Landing page
        req.flash("success", "Successfully Signed Up!");

        // Login the current User
        Passport.authenticate("local", {
            successRedirect: "/chats",
            failureRedirect: "/"    // Not necessary, but for safety :)
        })(req, res, next);

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});

// Post Request to '/login' for logging in
app.post('/login', (req, res, next) => {
    Passport.authenticate('local', (err, user) => {
        if (err) { return next(err); }
        if (!user) {
            req.flash("error", "Invalid Credentials!");
            return res.redirect('/');
        }
        req.logIn(user, err => {
            if (err) { return next(err); }

            req.flash("success", `Welcome back ${user.username}!`);
            return res.redirect('/chats');
        });
    })(req, res, next);
});

// Get Request for Logging Out
app.get('/logout', (req, res) => {
    req.logout();
    req.flash("success", "Thank you for using ChitChat.....!!");
    res.redirect('/');
});

// AJAX Get Request for getting Username
app.get("/details", checkLoggedIn, (req, res) => {
    res.send({
        username: req.user.username
    });
});


// USING ROUTERS
app.use("/", require("./routes"));


// Redirect to Home Page if Request for a non-existing Page
app.get("*", (req, res) => {
    req.flash("error", "Page does not exist!!");
    res.redirect("/");
});


// ====================
//      Sockets
// ====================

io.on("connection", socket => {
    let chatId;
    let url;
    let isChannel;
    let username;

    // Receive Data from the User,
    socket.on("data", async data => {
        url = data.url;
        isChannel = data.isChannel;
        username = data.username;

        // Store the username in Socket
        socket.username = username;

        // Extract Chat ID from URL
        if (isChannel) {
            const index = url.indexOf("/channels/");
            chatId = url.substr(index + 10);
        }
        else {
            const index = url.indexOf("/chats/");
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
            // Emit the new Chat members

            // Find clients connected in the Channel's Room
            io.of("/").in(chatId).clients((err, sockets) => {
                // Sockets is Array of all Socket ID's Connected

                // For each socket in sockets, replace it with its username stored in socket
                sockets.forEach((socket,index,sockets) => {
                    sockets[index] = io.sockets.sockets[socket].username;
                });

                // Emit the array of all usernames connected
                io.to(chatId).emit("Members", sockets);
                // Emit that current user has joined Channel
                io.to(chatId).emit("alert", `${username} has joined the Channel.....`);
            });
        }
        else {
            // else, Send old Messages to User

            try {
                // Find Chat with Extracted Chat ID                
                const chat = await Chat.findById(chatId);
                
                // Emit old messages to User
                socket.emit("Messages", chat.chat);

                // Remove unreadMessages
                chat.members.forEach(member => {
                    member.unreadMessages = 0;
                });

                await chat.save();

            } catch (err) {
                console.error(err.stack);
                throw err;
            }
        }
    });

    // On receiving New message from User
    socket.on("new message", async message => {
        // Sanitize the Message
        message.message = sanitizeHTML(message.message, {allowedTags});
        // Trim the message for Starting and Ending Whitespaces
        message.message = message.message.trim();


        message.for = [];
        // Check for a Whisper
        if (message.message != "" && message.message[0] == '@') {
            message.message = message.message.slice(1);
            const messageArray = message.message.split(":");
            message.for.push(messageArray[0].trim());
            message.for.push(message.sender);
            message.message = messageArray.slice(1).join(":");
        }

        // Don't add Empty Messages
        if (message.message === "")
            return;

        try {
            // Find the Chat
            const chat = await Chat.findById(chatId);

            // Add the message to the Chat
            chat.chat = chat.chat.concat(message);
            await chat.save();

            // Emit the new chat to everyone in the room
            io.to(chatId).emit("message", message);

            // Find clients connected to the Chat
            io.of('/').in(chatId).clients(async (err, sockets) => {
                // Sockets is Array of Socket IDs of all connected clients

                // For each socket, replace it with its username
                sockets.forEach((socket, index, sockets) => {
                    sockets[index] = io.sockets.sockets[socket].username;
                });

                // Increment unreadMessages of each offline members
                const savePromises = [];
                chat.members.forEach((member, index, members) => {
                    if(sockets.indexOf(member.username)==-1) {
                        ++members[index].unreadMessages;
                        savePromises.push(chat.save());
                    }
                });
                await Promise.all(savePromises);
            });

        } catch (err) {
            console.error(err.stack);
            throw err;
        }
        
    });


    // When User typed in Chat Box
    socket.on("typed", username => {
        // Emit username is typing message
        // to everyone in room except socket
        socket.to(chatId).broadcast.emit("typing", username);
    });

    // Remove User from Members of Channel on leaving
    socket.on("disconnect", () => {
        if (isChannel) {
            // Emit the new Chat members

            // Find clients connected in the Channel's Room
            io.of("/").in(chatId).clients((err, sockets) => {
                // Sockets is Array of all Socket ID's Connected

                // For each socket in sockets, replace it with its username stored in socket
                sockets.forEach((socket,index,sockets) => {
                    sockets[index] = io.sockets.sockets[socket].username;
                });

                // Emit the array of all usernames connected
                io.to(chatId).emit("Members", sockets);
                // Emit that current user has left Channel
                io.to(chatId).emit("alert", `${username} has left the Channel.....`);
            });
        }
    });
});


// Listen at PORT specified in CONFIG
server.listen(CONFIG.SERVER.PORT, () => {
    console.log("Server Started");
});