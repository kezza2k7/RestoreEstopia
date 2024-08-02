require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const db = require('./models/index');
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

const app = express();

// Register event handlers
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Sync Sequelize models
    db.sequelize.sync();
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
