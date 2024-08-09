require('dotenv').config();
const { Key, AuthedUsers, ApprovedUsers, Panels } = require('../models');
const { getValidToken } = require('../utils');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'manual',
    description: 'Manually verify a user',
    async execute(interaction) {
        const user = interaction.user;
        const guild = interaction.guild;

        try {
            const ApprovedUser = await ApprovedUsers.findOne({ where: { userId: user.id, serverId: guild.id } });

            let AuthedUser = await AuthedUsers.findByPk(user.id);
            
            if (!AuthedUser) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Verification Required')
                    .setDescription('Use the Verify')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            const accessToken = AuthedUser.accessToken;
            const refreshToken = AuthedUser.refreshToken;
            
            const ValidToken = await getValidToken(accessToken, refreshToken);
            
            if (!ValidToken) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Invalid Token')
                    .setDescription('Your access token is invalid and your data has been removed.')
                    .setTimestamp();
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            const server = await Key.findOne({ where: { serverId: guild.id } });
            
            if (!server) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Unauthorized Server')
                    .setDescription('This server is not authorized to use this command.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            const Panel = await Panels.findOne({ 
                where: { 
                    guildId: guild.id, 
                    channelId: interaction.channel.id, 
                    messageId: interaction.message.id 
                } 
            });
            
            if (!Panel) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Panel Not Found')
                    .setDescription('This Panel isn\'t found, This will need reset up.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            const role = guild.roles.cache.get(Panel.roleId);
            
            if (!role) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Role Not Found')
                    .setDescription('The role for this server is not found.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            
            let member = await guild.members.cache.get(user.id);
            if (!member) {
                try {
                    member = await guild.members.fetch(user.id);
                } catch (error) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Member Not Found')
                        .setDescription('Member not found in server.')
                        .setTimestamp();
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }
            try {
                await member.roles.add(role);
            } catch (error) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error: Permissions')
                    .setDescription('The Bot needs to be higher on the role hierarchy.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Authorization Successful')
                .setDescription(`You have been authorized, and <@&${role.id}> has been given to you.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            if(!ApprovedUser){
                await ApprovedUsers.create({ userId: user.id, serverId: guild.id });
            }
        } catch (error) {
            console.error('Error fetching AuthedUser:', error);
            return interaction.reply('An error occurred while fetching your data.');
        }
    }
}
