const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Users = require('./models/users.js');

// User Serialized with unique Username
passport.serializeUser(function (user, done) {
    // Call done with User's Username
    done(null, user.username);
});

// Deserialize User to get User Back
passport.deserializeUser(function (username, done) {
    // Find Users with Username(ideally, length 1)
    Users.findAll({
        where: {
            username: username
        }
    }).then(function (users, err) {
        if (err) throw err;
        // Call done with Whole User
        done(null, users[0]);
    });
});

// Create a local Strategy to Autherize Users locally
const localStrategy = new LocalStrategy(
    function (username, password, done) {
        // Find all Users with entered Username(ideally length 1)
        Users.findAll({
            where: {
                username: username
            }
        }).then(function (users, err) {
            if (err) return done(err);
            // If the User's Password is correct, call done with the User
            if (users[0].password === password) {
                return done(null, users[0]);
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