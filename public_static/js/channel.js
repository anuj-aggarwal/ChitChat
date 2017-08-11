var chatList;   // ul containing chats
var membersList;    // ul containing members
var sendButton;
var input;
var messagesContainer;

var username;   // Username of current User

$(function () {
    chatList = $("#messages-list");
    membersList = $("#members-list");
    sendButton = $("#send-button");
    input = $("#input");
    messagesContainer= $("#messages-container");


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
        // Display Chat only if username in chat.for, or chat.for is empty
        if(chat.for.length==0 || chat.for.indexOf(username)!=-1){
            // Remove any typing messages if present
            $("#typing").remove();
            // Append the new message
            chatList.append(`
                <li>
                    <b>${chat.sender}:</b> ${chat.message}                
                </li>
            `);

            // Scroll to bottom of container
            updateScroll();
        }
    });


    // Append typing message when received after removing previous typing messages
    // And remove current typing message after 1 second
    socket.on("typing", function(username){
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
        setTimeout(function(){
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
    input.on("keypress", function(event){
        if(event.keyCode === 13)
            sendButton.click();
        else{
            // Send typed event to Server with username
            socket.emit("typed", username);
        }
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


// Scrolls the container to the bottom
function updateScroll(){
    messagesContainer.scrollTop(messagesContainer.prop("scrollHeight"));
}