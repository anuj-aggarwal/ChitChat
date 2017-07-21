const Sequelize = require('sequelize');

const db = new Sequelize({
    host: 'localhost',
    username: 'chitchat',
    database: 'ChitChat',
    password: 'AnujDev',
    dialect: 'mysql'
});

const Users = db.define('users', {
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

db.sync({alter:true}).then(function () {
    console.log("Database Users is Ready");
});

module.exports = Users;