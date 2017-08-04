const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('./models/users.js');

// User Serialized with unique Username
passport.serializeUser(function (user, done) {
    // Call done with User's Username
    done(null, user.username);
});

// Deserialize User to get User Back
passport.deserializeUser(function (username, done) {
    // Find User with Username: username
    User.findByUsername(username).then(function (user) {
        // Call done with Whole User
        done(null, user);
    });
});

// Create a local Strategy to Autherize Users locally
const localStrategy = new LocalStrategy(
    function (username, password, done) {
        // Find User with entered Username
        User.findByUsername(username).then(function (user) {
            // If the User's Password is correct, call done with the User
            if (user.password === password) {
                return done(null, user);
            }
            // If wrong password, call done with Wrong password message
            else {
                return done(null, false, {message: 'Wrong password'});
            }
        }).catch(function(){
            // If username not found, Call done with User not found
            return done(null, false, {message: 'User not found'});
        });
    });

// Use the local Strategy at 'local'(although its already default)
passport.use('local', localStrategy);


// Export passport
module.exports = passport;