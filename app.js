const express = require("express");
const app = express();

const bodyParser = require("body-parser");

const Users = require("./models/users.js");

// Use Body Parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


// ROUTES
app.post('/', function (req, res, next) {
    // TODO: Add UserName Validation for same Users
    console.log("In server");
    Users.create({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        name: req.body.firstName + " " + req.body.lastName
    });
    next();
});


// MOUNTING STATIC FILES
app.use('/', express.static(__dirname + "/public_static"));


// Listen at 3000
app.listen(3000, function () {
    console.log("Server Started");
});