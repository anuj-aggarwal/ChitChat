var chatList;   // ul containing chats
var membersList;    // ul containing members
var sendButton;
var input;
var messagesContainer;

var username;   // Username of current User

$(function () {
    // Initialize the Slideout Members Side-Nav
    $('#members-collapse').sideNav({
        edge: 'right', // Horizontal Origin: Left Edge
        closeOnClick: true, // Closes on <a> clicks
        draggable: true // Drag to open on touch screens
    });

    chatList = $("#messages-list");
    membersList = $("#members-list");
    sendButton = $("#send-button");
    input = $("#input");
    messagesContainer = $("#messages-container");


    // Connect with the Server via Socket
    var socket = io();


    // Get the Username of current user by making an AJAX request
    $.get("/details", function (data) {
        username = data.username;

        // Emit the Current URL and isChannel for server to get the chatID
        socket.emit("data", {
            url: window.location.pathname,
            isChannel: true,
            username: username
        });
    });


    // Get members from server
    socket.on("Members", function (members) {
        // Clear the Members List
        membersList.html("");
        // For each member, append to the list
        for (var member of members) {
            membersList.append(`
                <li>
                    ${member}
                </li>
            `);
        }
    });

    // Append new messages when received
    socket.on("message", function (chat) {
        // If the message is a normal message
        if (chat.for.length === 0) {
            // Remove any typing messages if present
            $("#typing").remove();

            // Append the new message
            appendMessage(chat);

            // Scroll to bottom of container
            updateScroll();
        }
        // If the message is a whisper meant for current User
        else if (chat.for.indexOf(username) != -1) {
            // Remove any typing messages if present
            $("#typing").remove();

            // Append the new message
            appendWhisper(chat);

            // Scroll to bottom of container
            updateScroll();
        }
    });

    socket.on("alert", function (alertMessage) {
        // Remove any typing messages if present
        $("#typing").remove();

        // Append the new message
        appendAlert(alertMessage);

        // Scroll to bottom of container
        updateScroll();

    });

    // Append typing message when received after removing previous typing messages
    // And remove current typing message after 1 second
    socket.on("typing", function (username) {
        // Remove previous typing messages if present
        $("#typing").remove();
        // Display typing message
        chatList.append(`
            <li id="typing">
                <b>${username} is typing.....</b>
            </li>
        `);
        // Scroll to bottom of Container
        updateScroll();

        // Remove the message after 1 second
        setTimeout(function () {
            $("#typing").remove();
        }, 1000);
    });


    // --------------------
    //   EVENT LISTENERS
    // --------------------

    sendButton.click(function () {
        // Emit the message along with Sender
        socket.emit("new message", {
            sender: username,
            message: input.val()
        });
        // Clear the input
        input.val("");
    });

    // Send the message on pressing ENTER in input box
    // emit typed event if any other key
    input.on("keypress", function (event) {
        if (event.keyCode === 13)
            sendButton.click();
        else {
            // Send typed event to Server with username
            socket.emit("typed", username);
        }
    });


    // Add Event Listener to Favourite Channel Icon
    var favouriteIcon = $("#favourite-icon");
    favouriteIcon.click(function () {
        // Send AJAX POST Request to server with Channel Name
        $.post("/channels/fav", {
            channelName: $("#channel-heading").text().trim()
        }, function (isFavourite) {
            // If Channel is now in Favourite Channels
            if (isFavourite) {
                favouriteIcon.attr("class", "yellow-text text-accent-4 right");
            }
            else {
                // Channel is not in favourite Channels Now
                favouriteIcon.attr("class", "white-text right");
            }
        });
    });

});


// Appends a whisper to list
function appendWhisper(chat) {
    chatList.append(`
                <li>
                    <b>${chat.sender}:</b> <span class="grey-text">${chat.message}</span>                
                </li>
            `);
}

// Appends an alert to list
function appendAlert(alertMessage) {
    chatList.append(`
                <li>
                    <span class="red-text">${alertMessage}</span>                
                </li>
            `);
}

// Appends a normal message to list
function appendMessage(chat) {
    chatList.append(`
                <li>
                    <b>${chat.sender}:</b> ${chat.message}                
                </li>
            `);
}

// Scrolls the container to the bottom
function updateScroll() {
    messagesContainer.scrollTop(messagesContainer.prop("scrollHeight"));
}