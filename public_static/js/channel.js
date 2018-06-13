$(() => {
    // Initialize the Slideout Members Side-Nav
    $("#members-collapse").sideNav({
        edge: "right", // Horizontal Origin: Left Edge
        closeOnClick: true, // Closes on <a> clicks
        draggable: true // Drag to open on touch screens
    });

    const $chatList = $("#messages-list"); // ul containing chats
    const $membersList = $("#members-list"); // ul containing members
    const $sendButton = $("#send-button");
    const $input = $("#input");
    const $messagesContainer = $("#messages-container");

    let timeoutId = null;   // Id of timeout to clear typing message
    let username = null; // Username of current User

    // Connect with the Server via Socket
    const socket = io("/channels");


    // Get the Username of current user by making an AJAX request
    $.get("/details", data => {
        username = data.username;

        // Emit the Current URL for server to get the channelID and username
        socket.emit("data", {
            url: window.location.pathname,
            username
        });
    });


    // Get members from server
    socket.on("Members", members => {
        // Clear the Members List
        $membersList.html("");
        // For each member, append to the list
        members.forEach(member => {
            $membersList.append(`
                <li>
                    ${member}
                </li>
            `);
        });
    });

    // Append new messages when received
    socket.on("message", (chat) => {
        // Remove any typing messages if present
        clearTypingMessage(timeoutId);

        // Append the new Message
        // If the message is a normal message
        if (chat.for.length === 0) {
            appendMessage($chatList, chat);
        }
        // If the message is a whisper meant for current User
        else if (chat.for.indexOf(username) !== -1) {
            appendWhisper($chatList, chat);
        }

        // Scroll to bottom of container
        updateScroll($messagesContainer);
    });

    socket.on("alert", (alertMessage) => {
        // Remove any typing messages if present
        clearTypingMessage(timeoutId);

        // Append the new message
        appendAlert($chatList, alertMessage);

        // Scroll to bottom of container
        updateScroll($messagesContainer);
    });

    // Append typing message when received after removing previous typing messages
    // And remove current typing message after 1 second
    socket.on("typing", (username) => {
        // Remove previous typing messages if present
        clearTypingMessage(timeoutId);

        // Display typing message
        $chatList.append(`
            <li id="typing">
                <b>${username} is typing.....</b>
            </li>
        `);

        // Scroll to bottom of Container
        updateScroll($messagesContainer);

        // Remove the message after 1 second
        timeoutId = setTimeout(() => {
            $("#typing").remove();
        }, 500);
    });



    // --------------------
    //   EVENT LISTENERS
    // --------------------

    $sendButton.click(() => {
        // Emit the message along with Sender
        socket.emit("new message", {
            sender: username,
            body: $input.val()
        });
        // Clear the input
        $input.val("");
    });

    // Send the message on pressing ENTER in input box
    // emit typed event if any other key
    $input.on("keypress", (event) => {
        if (event.keyCode === 13)
            $sendButton.click();
        else {
            // Send typed event to Server with username
            socket.emit("typed", username);
        }
    });


    // Add Event Listener to Favourite Channel Icon
    const $favouriteIcon = $("#favourite-icon");
    $favouriteIcon.click(() => {
        // Send AJAX POST Request to server with Channel Name
        $.post("/channels/fav", { channelId: $("#channel-id").val() },
            (isFavourite) => {
                // If Channel is now in Favourite Channels
                if (isFavourite) {
                    $favouriteIcon.attr(
                        "class",
                        "yellow-text text-accent-4 right"
                    );
                } else {
                    // Channel is not in favourite Channels Now
                    $favouriteIcon.attr("class", "white-text right");
                }
            }
        );
    });
});


// Appends a whisper to list
const appendWhisper = ($chatList, chat) => {
    $chatList.append(`
        <li>
            <b>${chat.sender}:</b> <span class="grey-text">${chat.body}</span>                
        </li>
    `);
};

// Appends an alert to list
const appendAlert = ($chatList, alertMessage) => {
    $chatList.append(`
        <li>
            <span class="red-text">${alertMessage}</span>                
        </li>
    `);
};

// Appends a normal message to list
const appendMessage = ($chatList, chat) => {
    $chatList.append(`
        <li>
            <b>${chat.sender}:</b> ${chat.body}                
        </li>
    `);
};

// Scrolls the container to the bottom
const updateScroll = ($messagesContainer) => {
    $messagesContainer.scrollTop($messagesContainer.prop("scrollHeight"));
};

// Clears any typing message
const clearTypingMessage = (timeoutId) => {
    $("#typing").remove();
    clearTimeout(timeoutId);
    timeoutId = null;
};