const { Key, ApprovedUsers, AuthedUsers } = require('../models');
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { addUserToGuild, getValidToken } = require('../utils');

module.exports = {
    name: 'usekey',
    description: 'Uses a key to pull users from another server',
    data: new SlashCommandBuilder()
        .setName('usekey')
        .setDescription('Use a key to pull users from another server')
        .addStringOption(option => 
            option.setName('key')
                .setDescription('The key to use')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const key = interaction.options.getString('key');

        try {
            const keyEntry = await Key.findOne({ where: { key } });
            if (!keyEntry) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Invalid Key')
                    .setDescription('The provided key is invalid.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        
            if (keyEntry.serverId == interaction.guild.id) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Invalid Server')
                    .setDescription('You cannot use the key on this server.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const members = await ApprovedUsers.findAll({ where: { serverId: keyEntry.serverId } });
            const memberIds = members.map(member => member.userId);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Processing Members')
                .setDescription(`Processing ${memberIds.length} members...`)
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed], ephemeral: true });
            
            for (const memberId of memberIds) {
                console.log(`Processing member: ${memberId}`);
                const user = await AuthedUsers.findByPk(memberId);
                if(!user){
                    console.warn(`User not found: ${memberId}`);
                    continue;
                }

                const accessToken = user.accessToken;
                const refreshToken = user.refreshToken;

                const validToken = await getValidToken(accessToken, refreshToken, memberId, keyEntry.serverId);

                await addUserToGuild(interaction.guild.id, memberId, validToken);
            }
        } catch (error) {
            console.error('Error processing usekey command:', error);
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('An error occurred while processing your request.')
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};

