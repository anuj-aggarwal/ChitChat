const route = require("express").Router();

// Databases
const { Group, Chat } = require("../models");

// Utilities
const { checkLoggedIn } = require("../utils/auth");


//====================
//       ROUTES
//====================


// Get Request for New Group Page
route.get("/new", checkLoggedIn, (req, res) => {
    // Render newGroup with Current User's Details
    res.render("group/new", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});


// Post Request for Creating New Group
route.post("/", checkLoggedIn, async (req, res) => {
    try {
        // Check if Group Name is Already present
        const group = await Group.findByName(req.body.groupName);

        // If Group is already present
        if (group !== null) {
            req.flash("error", `Group ${req.body.groupName} already present!`);
            return res.redirect("/groups/new");
        }

        // If Group is not Present
        // Create Chat for new Group
        const chat = await Chat.create({ messages: [] });

        // Create the New Group
        const newGroup = await Group.create({
            name: req.body.groupName,
            members: [{
                username: req.user.username,
                unreadMessages: 0
            }],
            chat: chat
        });

        // Add new group to Current User's Groups
        req.user.groups.push(newGroup);
        await req.user.save();

        // Redirect User to New Chat Page
        res.redirect(`/groups/${newGroup.id}/chat`);

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});

// Get Request for Join Group Page
route.get("/join", checkLoggedIn, (req, res) => {
    // Render newChat with Current User's Details
    res.render("group/join", {
        success: req.flash("success"),
        error: req.flash("error")
    });
});

// Post Request for Joining Group
route.post("/join", checkLoggedIn, async (req, res) => {
    try {
        // Find group with entered Group Name
        const group = await Group.findByName(req.body.groupName);

        // If Group not found
        if (group === null) {
            req.flash("error", `Group ${req.body.groupName} not found!`);
            return res.redirect("/groups/join");
        }

        // Else, Group present

        const promises = [];
        // Add User to Group's Members if not already present
        if (group.members.findIndex(member => member.username === req.user.username) === -1) {
            group.members.push({
                username: req.user.username,
                unreadMessages: 0
            });
            promises.push(group.save());
        }

        // Add Group to User's Groups if not already present
        if (req.user.groups.filter(grp => grp.equals(group.id)).length === 0) {
            req.user.groups.push(group);
            promises.push(req.user.save());
        }

        await Promise.all(promises);

        res.redirect(`/groups/${group.id}/chat`);

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});


// GET Route for Group Chat page
route.get("/:groupId/chat", checkLoggedIn, async (req, res, next) => {
    try {
        // Find the group
        const group = await Group.findById(req.params.groupId);
        // If Group not found, go to next middleware(404 Route)
        if (group === null)
            return next();

        // Check if current user is a member of group
        if (group.members.findIndex(member => member.username === req.user.username) === -1) {
            req.flash("error", "Join the Group to Chat there!");
            return res.redirect("/chats");
        }

        // If User is a member of Group
        res.render("group", { title: group.name, groupId: group.id });

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// GET Route for Group Details page
route.get("/:groupId", checkLoggedIn, async (req, res, next) => {
    try {
        // Find the Group
        const group = await Group.findById(req.params.groupId);
        // If group not found, go to next middleware(404 Route)
        if (group === null)
            return next();
        
        // Check if current user is a member of group
        if (group.members.findIndex(member => member.username === req.user.username) === -1) {
            req.flash("error", "Join the group to know its Details!");
            return res.redirect("/chats");
        }

        // User is a member of group
        res.render("group/details", {
            title: group.name,
            groupId: group.id,
            members: group.members.map(member => member.username)
        });

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});


// DELETE Route for Removing a member from Group
route.post("/:groupId/leave", checkLoggedIn, async (req, res) => {
    try {
        // Find the Group
        const group = await Group.findById(req.params.groupId);

        if (group === null) {
            req.flash("error", "Group not found!");
            return res.redirect("/chats");
        }

        // Check if user is a member of group
        const index = group.members.findIndex(member => member.username === req.user.username);
        if (index === -1) {
            req.flash("error", "User not in the Group!!");
            return res.redirect("/chats");
        }
        
        const promises = [];

        // Remove user from group's members
        group.members.splice(index, 1);
        // If user was last member, remove the group
        if (group.members.length === 0) {
            // Remove Group's Chat
            promises.push(Chat.findByIdAndRemove(group.chat));
            promises.push(group.remove());
        }
        else
            promises.push(group.save());

        // Remove Group from user's Groups
        req.user.groups = req.user.groups.filter(grp => !grp.equals(group.id));
        promises.push(req.user.save());

        await Promise.all(promises);

        req.flash("success", `Successfully left the group ${group.name}!`);
        res.redirect("/chats");

    } catch (err) {
        console.error(err.stack);
        res.sendStatus(500);
    }
});


// Export current Route
module.exports = route;