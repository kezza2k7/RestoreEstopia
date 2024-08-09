require('dotenv').config();
const { AuthedUsers, ApprovedUsers } = require('../models');
const { getValidToken } = require('../utils');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'remove_data',
    description: 'Removes data from the server',
    async execute(interaction) {
        const parts = interaction.customId.split('-');

        const guildId = parts[1];

        const user = interaction.user;

        const Autheduser = await AuthedUsers.findByPk(user.id);

        if (!Autheduser) {
            const VerifyButton = new ButtonBuilder()
                .setLabel('Verify')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`)

            const row = new ActionRowBuilder()
                .addComponents(VerifyButton);

            return await interaction.reply({content: 'You are not authorized. Verify again to use this Button.', ephemeral: true, components: [row]});
        }

        const accessToken = Autheduser.accessToken;
        const refreshToken = Autheduser.refreshToken;

        const ValidToken = await getValidToken(accessToken, refreshToken, user.id, guildId);

        if (!ValidToken) {
            const VerifyButton = new ButtonBuilder()
                .setLabel('Verify')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`)

            const row = new ActionRowBuilder()
                .addComponents(VerifyButton);

            return await interaction.reply({content: 'Your access token is invalid. erify again to use this Button.', ephemeral: true, components: [row]});
        }

        let ApprovedUser = await ApprovedUsers.findOne({ where: { userId: user.id, serverId: guildId } });

        if (!ApprovedUser) {
            return await interaction.reply({content: `You have no Data Linked to the Server to Remove`, ephemeral: true});
        }

        await ApprovedUsers.destroy({ where: { userId: user.id, serverId: guildId } });

        const embed = new EmbedBuilder()
            .setTitle('Data Removed')
            .setDescription('Your data has been removed from the server.')
            .setTimestamp();

        await interaction.reply({ephemeral: true, embeds: [embed]});
    }
}