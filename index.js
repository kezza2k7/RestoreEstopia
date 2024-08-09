require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { REST, Routes } = require('discord.js');
const {sequelize, AuthedUsers, Key, ApprovedUsers, Panels} = require('./models/index');
const express = require('express');
const { readdirSync } = require('fs');
const createRouter = require('./server');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commands = fs.readdirSync(commandsPath);

console.log(`Loading commands from ${commandsPath}`);
for (const commandname of commands) {
    const filePath = path.join(commandsPath, commandname);
    console.log(`Loading command at ${filePath}`);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID),
			{ body: client.commands.map(command => command.data.toJSON()) },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

const app = express();

// Register event handlers
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Sync Sequelize models
    (async () => {
        try {
            await AuthedUsers.sync();
            await Key.sync();
            await ApprovedUsers.sync();
            await Panels.sync();
            console.log('Database models synced');
        } catch (error) {
            console.error('Failed to sync database models:', error);
        }
    })();
});

// Event Handler
(async () => {
    const eventFiles = readdirSync("./events").filter(file => file.endsWith(".js"));
    const eventNames = [];

    for (const file of eventFiles) {
        const event = require(`./events/${file}`);
        eventNames.push(` ${event.name}`);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }

    console.log(`Loaded Events: ${eventNames}`);
})();

app.use(express.json());

// Routes

const router = createRouter(client);
app.use('/', router);

client.login(process.env.DISCORD_TOKEN);

app.listen(2999, () => {
    console.log('Server running on port 2999');
});
