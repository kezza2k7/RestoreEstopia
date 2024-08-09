require('dotenv').config();
const { AuthedUsers} = require('../models');
const { getValidToken, addUserToGuild } = require('../utils');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'join_server',
    description: 'Joins a server',
    async execute(interaction) {
        const parts = interaction.customId.split('-');
        const guildId = parts[1];
        const user = interaction.user;
        const Autheduser = await AuthedUsers.findByPk(user.id);

        if (!Autheduser) {
            const VerifyButton = new ButtonBuilder()
                .setLabel('Verify')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`);

            const row = new ActionRowBuilder()
                .addComponents(VerifyButton);

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Verification Required')
                .setDescription('Use the button below to ReVerify.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true, components: [row] });
        }

        const accessToken = Autheduser.accessToken;
        const refreshToken = Autheduser.refreshToken;
        const ValidToken = await getValidToken(accessToken, refreshToken, user.id, guildId);

        if (!ValidToken) {
            await AuthedUsers.destroy({ where: { userId: user.id } });

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Invalid Token')
                .setDescription('Your access token is invalid. Press the Join Button again.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        let results = await addUserToGuild(guildId, user.id, ValidToken);
        if (results) {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Success')
                .setDescription('You have been added to the server.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('An error occurred while adding you to the server.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}