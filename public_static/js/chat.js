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
            list.append(`
                <li>
                    <b>${chat.sender}:</b> ${chat.message}                
                </li>
            `);
        }
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