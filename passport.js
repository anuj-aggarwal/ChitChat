const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Bcrypt
const bcrypt = require("bcrypt");

const User = require('./models/users.js');

// User Serialized with unique Username
passport.serializeUser(function (user, done) {
    // Call done with User's Username
    done(null, user.username);
});

// Deserialize User to get User Back
passport.deserializeUser(function (username, done) {
    // Find User with Username: username
    User.findOne({
        username
    }, function(err, user){
        // Call done with err, user
        done(err, user);
    });
});

// Create a local Strategy to Autherize Users locally
const localStrategy = new LocalStrategy(
    function (username, password, done) {
        // Find User with entered Username
        User.findOne({
            username: username
        }, function(err, user){
            if(err)
                return done(err);
            // If User not found
            if(!user)
                return done(null, false, {message: "User not found"});

            // Check for user's password
            bcrypt.compare(password, user.password, function(err, res){
                if(err)
                    return done(err);

                // If Password is Wrong
                if(res===false) {
                    return done(null, false, {message: "Password does not match!"});
                }
                else{
                    // Everything matched, User recognized
                    return done(null, user);
                }
            });


        });
    });

// Use the local Strategy at 'local'(although its already default)
passport.use('local', localStrategy);


// Export passport
module.exports = passport;