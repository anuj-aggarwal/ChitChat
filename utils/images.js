// CONFIG
const { CLOUDINARY } = require("../config");

// Multer: For File Upload Handler
const multer = require("multer");
// CLOUDINARY: For Image Uploads
const cloudinary = require("cloudinary");

// Initialize Multer
const upload = multer({
    dest: "./uploads",  // Path for temporary storage of files
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/))
            return cb(null, false);
        cb(null, true);
    }
});

// Initialize Cloudinary
cloudinary.config({ 
    cloud_name: CLOUDINARY.CLOUD_NAME,
    api_key: CLOUDINARY.API_KEY,
    api_secret: CLOUDINARY.API_SECRET
});

module.exports = { upload, cloudinary };