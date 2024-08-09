# RestoreEstopia

## Description
This is a similar application to RestoreCord which is used to protect discord servcers from raiders, nukes etc. This is a diffrent version of that bot that has some extra features and is open source.

## Features
### Ideas that could be added:
- Web UI (Login with discord)
- Resetting Keys
- Pulling Members back to the same server (This may not happen due to if people leave your server they may not want to come back)

### Added ->
- Key System (Messages the owner of the server with the key, When the bot joins the server)
- Verify System (Prompts the user to verify the bot with a Manual Verication button if this fails)
- Add Bot to User to get send the Leave message that makes it easy for the user to rejoin the server or remove there connection to the server.
- Slash Commands
- Permissions Check

## Installation
1. Clone the repository: `git clone https://github.com/kezza2k7/RestoreEstopia`
2. Navigate to the project directory: `cd RestoreEstopia`
3. Use `npm install` to install the required packages
4. Start the bot with `node index.js`

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
4. Use the `!verify` command to setup verification

## Contributing
Contributions are welcome! If you have any ideas or suggestions, please open an issue or submit a pull request.