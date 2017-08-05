var list;   // ul containing chats
var sendButton;
var input;

var username;   // Username of current User

$(function(){
    list = $("#messages-list");
    sendButton = $("#send-button");
    input = $("#input");



    // Connect with the Server via Socket
    var socket = io();

    // Get the Username of current user by making an AJAX request
    $.get("/details", function(data){
        username = data.username;

        // Emit the Current URL and isChannel for server to get the chatID
        socket.emit("data", {
            url: window.location.pathname,
            isChannel: false,
            username: username
        });
    });


    // Get old messages from the server
    socket.on("Messages", function(chats){
        // Clear the list
        list.html("");
        // For each message, append to the list
        for (chat of chats) {
            // Display message only if username in chat.for, or chat.for is empty
            if(chat.for.length==0 || chat.for.indexOf(username)!=-1){
                list.append(`
                <li>
                    <b>${chat.sender}:</b> ${chat.message}                
                </li>
            `);
            }
        }
    });

    // Append new messages when received
    socket.on("message", function(chat){
        // Display message only if username in chat.for, or chat.for is empty
        if(chat.for.length==0 || chat.for.indexOf(username)!=-1){
            // Remove any typing messages if present
            $("#typing").remove();
            // Append the new message
            list.append(`
                <li>
                    <b>${chat.sender}:</b> ${chat.message}                
                </li>
            `);
        }
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
            message: input.val()
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