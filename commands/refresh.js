const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Key } = require("../models");
const { generateKey } = require("../utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refresh')
        .setDescription('Refresh the data for RestoreEstopia')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const client = interaction.client;
        const key = generateKey();
        const guild = interaction.guild;
        const serverId = guild.id;
        const serverName = guild.name;
        const ownerId = guild.ownerId;
    
        try {
            // Delete old keys for the server
            await Key.destroy({ where: { serverId } });
    
            // Create new key entry
            await Key.create({ key, serverId, serverName, ownerId });
            console.log(`Key created for server ${serverName}: ${key}`);
    
            // Send key to the owner
            const owner = await client.users.fetch(ownerId);
            await owner.send(`Your ${serverName}(${serverId}) has been assigned a key: ${key}`);
            interaction.reply({ content: 'Key has been refreshed', ephemeral: true });
        } catch (error) {
            console.error('Error handling guildCreate event:', error);
        }
    }
};
