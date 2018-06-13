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
const mongoose = require("./db");

// Databases
const { User } = require("./models");


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
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
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

require("./socket/chats")(io.of("/chats"));
require("./socket/groups")(io.of("/groups"));
require("./socket/channel")(io.of("/channels"));



// Listen at PORT specified in CONFIG
server.listen(CONFIG.SERVER.PORT, () => {
    console.log("Server Started");
});