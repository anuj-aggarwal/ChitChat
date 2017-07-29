var list;   // ul containing chats
var sendButton;
var input;

var username;   // Username of current User

$(function(){
    list = $("#messages-list");
    sendButton = $("#send-button");
    input = $("#input");

    // Get the Username of current user by making an AJAX request
    $.get("/details", function(data){
        username = data.username
    });

    // --------------------
    //      SOCKETS
    // --------------------

    // Connect with the Server via Socket
    var socket = io();

    // Emit the Current URL and isChannel for server to get the chatID
    socket.emit("url", {
        url: window.location.pathname,
        isChannel: true
    });

    // Append new messages when received
    socket.on("message", function(chat){
        list.append(`
                <li>
                    <b>${chat.sender}:</b> ${chat.message}                
                </li>
            `);
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
    input.on("keypress", function(event){
        if(event.keyCode === 13)
            sendButton.click();
    });


});