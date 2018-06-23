$(() => {
    // Initialize the Slideout Side-Nav
    $("#profile-collapse").sideNav({
        edge: "left", // Horizontal Origin: Left Edge
        closeOnClick: true, // Closes on <a> clicks
        draggable: true // Drag to open on touch screens
    });

    // Trigger Upload Button on Edit Button Click
    const $imageUploadInput = $("#image-upload-input");
    $("#image-edit-btn").click(() => {
        $imageUploadInput.click();
    });

    // Submit Form on Image Upload
    $imageUploadInput.change(() => {
        $("#image-upload-form").submit();
    });
});