$(() => {
    const $userImage = $("#user-image");

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

    $("#image-remove-btn").click(() => {
        if (!confirm("Confirm Remove Profile Photo?"))
            return;
        $.ajax({
            url: "/image",
            type: 'DELETE'
        })
         .then(({ success }) => {
             if (success) {
                $userImage.attr("src", "https://via.placeholder.com/150x150.jpg");
             }
             else {
                 console.error("Error Removing User Image");
             }
         })
         .catch(err => {
             console.log(err);
         });
    });

    // Send AJAX Request on Image Upload
    $imageUploadInput.change((event) => {
        if (!confirm("Confirm Change Profile Photo?"))
            return;
        const formData = new FormData();
        formData.append("image", event.target.files[0]);

        $.ajax({
            url: "/image",
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false
        })
         .then(({ url }) => {
             $userImage.attr("src", url);
         })
         .catch(({ responseText }) => {
             console.error(responseText || "Error Uploading Image!");
         });
    });
});