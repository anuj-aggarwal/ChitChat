let config;

switch (process.env.NODE_ENV) {
    case "production":
        config = {
            SERVER: {
                PORT: process.env.PORT
            },
            DB: {
                USERNAME: process.env.DB_USERNAME,
                PASSWORD: process.env.DB_PASSWORD,
                HOST: process.env.DB_HOST,
                PORT: process.env.DB_PORT,
                NAME: process.env.DB_NAME
            },
            SESSION_SECRET: process.env.SESSION_SECRET,
            COOKIE_SECRET: process.env.COOKIE_SECRET,
            CLOUDINARY: {
                CLOUD_NAME: process.env.CLOUD_NAME,
                API_KEY: process.env.API_KEY,
                API_SECRET: process.env.API_SECRET
            }
        };
        break;

    default:
        config = require("./secret.json");
        break;
}

module.exports = config;