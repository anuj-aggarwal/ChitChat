# ChitChat

A Bot Integrable Chatting Platform which allows users to Chat with Friends in Private Chat, Groups and Channels.
- Private Chat: Chat with other Users or Chat Bots privately by their username
- Group: Join a Group by Name and chat with groups of friends. Does not allow Chat Bots.
- Channel: Chat with Other Users or Chat Bots with a Dynamic Members List.

Other Features:
- Whispers: Whisper to a friend in Group or Channel, which only you and they can see.
- Favourite Channels: Mark Channels as Favourite for easily joining later

Hosted Live at: [https://chit-chat-node.herokuapp.com](https://chit-chat-node.herokuapp.com)


## Bot Integrability
The Application allows users to create own Node Bots for Private chats and Channels.

To create a Node Chat Bot for the Application, register on the website, Get Credentials for new Chat Bot, and use NPM Package **[chitchat-bot](https://www.npmjs.com/package/chitchat-bot)** to create a Chat Bot using Node.js.


## Getting Started

### Pre-Requisites

You need to have [MongoDB](https://www.mongodb.com/) installed locally, and [Cloudinary](https://cloudinary.com/) API Credentials in order to use the Application.

### Installation

```
git clone https://github.com/anuj-aggarwal/ChitChat.git
cd ChitChat
npm install
```

## Setup

Create a MongoDB user <DB_USER> with <DB_PASSWORD>

Create a secret.json file in this format:
```json
{
    "SERVER": {
        "PORT": "<PORT_NUMBER>"
    },
    "DB": {
        "USERNAME": "<DB_USERNAME>",
        "PASSWORD": "<DB_PASSWORD>",
        "HOST": "localhost",
        "PORT": 27017,
        "NAME": "<DB_NAME>"
    },
    "SESSION_SECRET": "<SESSION_SECRET>",
    "COOKIE_SECRET": "<COOKIE_SECRET>",
    "CLOUDINARY": {
        "CLOUD_NAME": "<CLOUDINARY_NAME>",
        "API_KEY": "<CLOUDINARY_API_KEY>",
        "API_SECRET": "<CLOUDINARY_API_SECRET"
    }
}
```

## Running

```
npm start
```

### Running MongoDB database
Make sure that MongoD is running. To start MongoDB Daemon, run these commands on a separate terminal:
```
mkdir data
mongod --dbpath=./data
```

## Built With

* [Express](https://expressjs.com/) - The Node.js Framework for HTTPS Server
* [Mongoose](http://mongoosejs.com/) - Node.js ORM for MongoDB Database
* [Passport](http://www.passportjs.org/) - Used for Authentication
* [Socket.io](https://socket.io/) - Node.js Framework for Handling Web Sockets
* [Cloudinary](https://cloudinary.com/) - Used for Image Hosting


## Authors

* [**Anuj Aggarwal**](https://github.com/anuj-aggarwal/)
* [**Dev Pabreja**](https://github.com/devpabreja)
