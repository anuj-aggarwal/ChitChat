var list;
var sendButton;
var input;
var username;

$(function(){
    list = $("#messages-list");
    sendButton = $("#send-button");
    input = $("#input");

    $.get("/details", function(data){
        username = data.username
    });

    var socket = io();
    socket.emit("url", window.location.pathname);

    socket.on("Messages", function(chats){
        for (chat of chats) {
            list.append(`
                <li>
                    <b>${chat.sender}:</b> ${chat.message}                
                </li>
            `);
        }
    });

    socket.on("message", function(chat){
            list.append(`
                <li>
                    <b>${chat.sender}:</b> ${chat.message}                
                </li>
            `);
    });



    sendButton.click(function(){
        socket.emit("new message", {
            sender: username,
            message: input.val()
        });
        input.val("");
    });

    input.on("keypress", function(event){
        if(event.keyCode === 13)
            sendButton.click();
    });


});