$(document).ready(() => {
    // ENABLE SCROLLING ON REDIRECTION TO VARIOUS DIVs
    $('.scrollspy').scrollSpy({
        scrollOffset: $('header').height()  // Remove the scroll offset defaulted to 200px
    });

    // Enable Collapsible Button
    $(".button-collapse").sideNav();
});