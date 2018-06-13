// HTML Sanitizer
const sanitizeHTML = require("sanitize-html");

const allowedTags = ["b", "i", "br", "a", "strong", "em"];

module.exports = {
    // Sanitizes Message's HTML and Trims the message for Starting and Ending Whitespaces
    sanitizeMessage: message => sanitizeHTML(message, { allowedTags }).trim()
};