const Sequelize = require('sequelize');

// Create the Connection with MySQL
const db = new Sequelize({
    host: 'localhost',
    username: 'chitchat',
    database: 'ChitChat',
    password: 'AnujDev',
    dialect: 'mysql'
});

// Define the Table users to store Users
const User = db.define('user', {
    id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: Sequelize.DataTypes.STRING,
    password: Sequelize.DataTypes.STRING,
    email: Sequelize.DataTypes.STRING,
    name: Sequelize.DataTypes.STRING
});

// Sync Database for already existing Database
db.sync({alter:true}).then(function () {
    console.log("Database Users is Ready");
});

// Export the Users Database
module.exports = User;