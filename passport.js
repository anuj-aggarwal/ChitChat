const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Bcrypt
const bcrypt = require("bcrypt");

const { User } = require('./models');

// User Serialized with unique Username
passport.serializeUser((user, done) => done(null, user.username));

// Deserialize User to get User Back
passport.deserializeUser(async (username, done) => {
    try {
        const user = await User.findByUsername(username);
        // Call done with user
        return done(null, user);

    } catch (err) {
        // Call done with error
        console.error(err.stack);
        return done(err);
    }
});

// Create a local Strategy to Autherize Users locally
const localStrategy = new LocalStrategy(async (username, password, done) => {
    try {
        // Find User with entered Username
        const user = await User.findByUsername(username);

        // If User not found
        if(!user)
            return done(null, false, {message: "User not found"});

        // Check for user's password
        const res = await bcrypt.compare(password, user.password);

        // If Password is Wrong
        if(res === false)
            return done(null, false, {message: "Password does not match!"});
        
        // Everything matched, User recognized
        return done(null, user);

    } catch (err) {
        console.error(err.stack);
        return done(err);
    }
});


// Use the local Strategy at 'local'(although its already default)
passport.use('local', localStrategy);


// Export passport
module.exports = passport;