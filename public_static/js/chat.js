var list;   // ul containing chats
var sendButton;
var input;
var messagesContainer;

var username;   // Username of current User

$(function(){
    list = $("#messages-list");
    sendButton = $("#send-button");
    input = $("#input");
    messagesContainer = $("#messages-container");

    // Connect with the Server via Socket
    var socket = io("/chats");

    // Get the Username of current user by making an AJAX request
    $.get("/details", function(data){
        username = data.username;

        // Emit the Current URL and isChannel for server to get the chatID
        socket.emit("data", {
            url: window.location.pathname,
            username: username
        });
    });

    // Get old messages from the server
    socket.on("Messages", function(chats){
        // Clear the list
        list.html("");
        // For each message, append to the list
        for (chat of chats) {
            // If the message is a normal message
            // if(chat.for.length===0) {
            //     appendMessage(chat);
            // }
            // // If the message is a whisper meant for current User
            // else if(chat.for.indexOf(username)!=-1) {
            //     appendWhisper(chat);
            // }
            appendMessage(chat);
        }
        // Scroll to bottom of container
        updateScroll();
    });

    // Append new messages when received
    socket.on("message", function(chat){
        // If the message is a normal message
        // if(chat.for.length===0){
        //     // Remove any typing messages if present
        //     $("#typing").remove();
        //     // Append the new message
        //     appendMessage(chat);

        //     // Scroll to bottom of container
        //     updateScroll();
        // }
        // // If the message is a whisper meant for current User
        // else if(chat.for.indexOf(username)!=-1){
        //     // Remove any typing messages if present
        //     $("#typing").remove();
        //     // Append the new message
        //     appendWhisper(chat);

        //     // Scroll to bottom of container
        //     updateScroll();
        // }
        appendMessage(chat);
        updateScroll();

    });


    // Append typing message when received after removing previous typing messages
    // And remove current typing message after 1 second
    socket.on("typing", function(username){
        // Remove previous typing messages if present
        $("#typing").remove();
        // Display typing message
        list.append(`
            <li id="typing">
                <b>${username} is typing.....</b>
            </li>
        `);
        // Scroll to bottom of container
        updateScroll();

        // Remove the message after 1 second
        setTimeout(function(){
            $("#typing").remove();
        }, 1000);
    });



    // --------------------
    //   EVENT LISTENERS
    // --------------------

    sendButton.click(function(){
        // Emit the message along with Sender
        socket.emit("new message", {
            sender: username,
            body: input.val()
        });
        // Clear the input
        input.val("");
    });

    // Send the message on pressing ENTER in input box
    // emit typed event if any other key
    input.on("keypress", function(event){
        if(event.keyCode === 13)
            sendButton.click();
        else{
            // Send typed event to Server with username
            socket.emit("typed", username);
        }
    });


});


// Appends a whisper to list
function appendWhisper(chat) {
    list.append(`
                <li>
                    <b>${chat.sender}:</b> <span class="grey-text">${chat.body}</span>                
                </li>
            `);
}

// Appends a normal message to list
function appendMessage(chat) {
    list.append(`
                <li>
                    <b>${chat.sender}:</b> ${chat.body}                
                </li>
            `);
}

// Scrolls the container to the bottom
function updateScroll(){
    messagesContainer.scrollTop(messagesContainer.prop("scrollHeight"));
}