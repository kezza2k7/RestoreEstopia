const path = require('path');
const fs = require('fs');

module.exports = {
	name: 'messageCreate',
	execute: async(message) => {
        if (message.author.bot) return;

        const prefix = '!'; // Your command prefix
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Load commands dynamically
        const commandsPath = path.resolve(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        const command = commandFiles.map(file => require(path.join(commandsPath, file)))
                                    .find(cmd => cmd.name === commandName);

        if (!command) return message.reply('Command not found.');

        try {
            await command.execute(message, args);
        } catch (error) {
            console.error('Error executing command:', error);
            await message.reply('An error occurred while executing the command.');
        }
    }
};
