$(() => {
    const $list = $("#messages-list"); // ul containing chats
    const $sendButton = $("#send-button");
    const $input = $("#input");
    const $messagesContainer = $("#messages-container");

    let timeoutId = null;   // Id of timeout to clear typing message
    let username;   // Username of current User


    // Connect with the Server via Socket
    const socket = io("/groups");

    // Get the Username of current user by making an AJAX request
    $.get("/details", (data) => {
        username = data.username;

        // Emit the Current URL and isChannel for server to get the chatID
        socket.emit("data", {
            url: window.location.pathname,
            username
        });
    });

    // Get old messages from the server
    socket.on("Messages", (chats) => {
        // Clear the list
        $list.html("");
        // For each message, append to the list
        chats.forEach(chat => {
            // If the message is a normal message
            if (chat.for.length === 0) {
                appendMessage($list, chat);
            }
            // If the message is a whisper meant for current User
            else if (chat.for.indexOf(username) !== -1) {
                appendWhisper($list, chat);
            }
        });
        // Scroll to bottom of container
        updateScroll($messagesContainer);
    });

    // Append new messages when received
    socket.on("message", (chat) => {
        // Remove any typing messages if present
        clearTypingMessage(timeoutId);

        // Append the new message
        // If the message is a normal message
        if (chat.for.length === 0) {
            appendMessage($list, chat);
        }
        // If the message is a whisper meant for current User
        else if (chat.for.indexOf(username) !== -1) {
            appendWhisper($list, chat);
        }

        // Scroll to bottom of container
        updateScroll($messagesContainer);
    });


    // Append typing message when received after removing previous typing messages
    // And remove current typing message after 1 second
    socket.on("typing", (username) => {
        // Remove previous typing messages if present
        clearTypingMessage(timeoutId);

        // Display typing message
        $list.append(`
            <li id="typing">
                <b>${username} is typing.....</b>
            </li>
        `);

        // Scroll to bottom of container
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

});

// Appends a normal message to list
const appendMessage = ($list, message) => {
    $list.append(`
        <li>
            <b>${message.sender}:</b> ${message.body}                
        </li>
    `);
};

// Appends a whisper to list
const appendWhisper = ($list, message) => {
    $list.append(`
        <li>
            <b>${message.sender}:</b> <span class="grey-text">${message.body}</span>                
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