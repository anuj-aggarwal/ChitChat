var chatList;   // ul containing chats
var membersList;    // ul containing members
var sendButton;
var input;

var username;   // Username of current User

$(function () {
    chatList = $("#messages-list");
    membersList = $("#members-list");
    sendButton = $("#send-button");
    input = $("#input");


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
        chatList.append(`
                <li>
                    <b>${chat.sender}:</b> ${chat.message}                
                </li>
            `);
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
    input.on("keypress", function (event) {
        if (event.keyCode === 13)
            sendButton.click();
    });


    // Add Event Listener to Favourite Channel Icon
    var favouriteIcon = $("#favourite-icon");
    favouriteIcon.click(function(){
        // Send AJAX POST Request to server with Channel Name
        $.post("/channels/fav", {
            channelName: $("#channel-heading").text().trim()
        }, function(isFavourite){
            // If Channel is now in Favourite Channels
            if(isFavourite){
                favouriteIcon.attr("class", "yellow-text text-accent-4 right");
            }
            else{
                // Channel is not in favourite Channels Now
                favouriteIcon.attr("class", "white-text right");
            }
        });
    });

});