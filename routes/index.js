const route = require("express").Router();


// Get Route for Home Page
route.get("/", (req, res) => {
    res.render("index", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});


route.use("/", require("./auth"));
route.use("/chats", require("./chats"));
route.use("/groups", require("./groups"));
route.use("/channels", require("./channels"));

// Redirect to Home Page if Request for a non-existing Page
route.get("*", (req, res) => {
    req.flash("error", "Page does not exist!!");
    res.redirect("/");
});

// Export current Route
module.exports = route;