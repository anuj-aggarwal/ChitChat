const Sequelize = require('sequelize');

// Create the Connection with MySQL
const db = new Sequelize({
    host: 'sql12.freemysqlhosting.net',
    username: 'sql12188654',
    database: 'sql12188654',
    password: 'vYNJGphgSG',
    dialect: 'mysql',
    port: 3306,
    logging: false
});

// Define the Table users to store Users
var User = db.define('user', {
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


// Define findByUsername for User
User.findByUsername = function(username){
    return User.findOne({
        where:{
            username: username
        }
    });
};


// Sync Database for already existing Database
db.sync({alter:true}).then(function () {
    console.log("Database Users is Ready");
});

// Export the Users Database
module.exports = User;