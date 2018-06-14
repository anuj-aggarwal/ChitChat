$(() => {
    const $secretKeyBtn = $(".secret-key-btn");
    $secretKeyBtn.click(event => {
        alert("Secret Key is: " + $(event.target).data("secret-key"));
    });
});