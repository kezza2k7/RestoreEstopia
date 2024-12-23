# RestoreEstopia

## Description
This is a similar application to RestoreCord which is used to protect discord servcers from raiders, nukes etc.This is a diffrent version of that bot that has some extra features and is open source.
This will also no longer be updated as I am replacing this with [Estopia Chat](https://chat.estopia.net).
If there are any issues ( reported in the issues tab ) I will fix them but no new features will be added.
There is a blog located at [jay.estopia.net](https://jay.estopia.net/blog/restore2) which is related to this project.

## Features
- Key System (Messages the owner of the server with the key, When the bot joins the server)
- Ticket System ( When a user logs in and wants to be verified it creates a ticket with buttons to approve and decline )
- Verify System (Prompts the user to verify the bot with a Manual Verication button if this fails)
- SendProve ( Context Menu to send a message to a prove channel set using /setup )
- Add Bot to User to get send the Leave message that makes it easy for the user to rejoin the server or remove there connection to the server.
- Slash Commands
- Docker Support ( Automatically builds the docker image )
- Permissions Check

## Installation
1. Clone the repository: `git clone https://github.com/kezza2k7/RestoreEstopia`
2. Navigate to the project directory: `cd RestoreEstopia`
3. Use `npm install` to install the required packages
4. Forward the port 2999 to the domain located in the REDIRECT_URI in the .env file
5. Start the bot with `node index.js`

## Docker
1. Use the docker container imaoreo/restoreestopia:latest
2. Forward the port 2999 to the domain located in the REDIRECT_URI in the .env file
3. Configure the environment variables in the docker run command
4. Start the container

## Usage
1. Setup the .env file with the following:
```env
DISCORD_TOKEN=
CLIENT_ID=
CLIENT_SECRET=
REDIRECT_URI=
```
2. Invite the bot to your server
3. Run the bot
4. Use the `/verify` command to setup verification

## Contributing
Contributions are welcome! If you have any ideas or suggestions, please open an issue or submit a pull request.
