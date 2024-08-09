require('dotenv').config();
const fs = require('fs');
const path = require('path');

module.exports = {
	name: 'interactionCreate',
	execute: async(interaction) => {

        if(interaction.isButton()){
            // Load commands dynamically
            const commandsPath = path.resolve(__dirname, '../Buttons');
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            let ButtonID = interaction.customId;
            if(interaction.customId.includes('-')) ButtonID = interaction.customId.split('-')[0]; 
    
            const command = commandFiles.map(file => require(path.join(commandsPath, file)))
                                        .find(cmd => cmd.name === ButtonID);
    
            if (!command) {
                console.log(`No command matching ${ButtonID} was found. Searching in ${commandsPath}`);
                return interaction.reply('Button not found.');
            }
    
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('Error executing button:', error);
                await interaction.reply('An error occurred while executing the Button.');
            }

        } else if (interaction.isCommand()) {
            if (!interaction.isChatInputCommand()) return;

            const command = interaction.client.commands.get(interaction.commandName);
        
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
        
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
    
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
    
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        }
    }
};
