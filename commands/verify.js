const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { Key } = require('../models');

module.exports = {
    name: 'verify',
    description: 'Send a verification button to the specified channel',
    async execute(message, args) {
        if (args.length !== 2) {
            return message.reply('Usage: !verify #channel @role');
        }

        const channelMention = message.mentions.channels.first();
        const roleMention = message.mentions.roles.first();

        if (!channelMention || !roleMention) {
            return message.reply('You need to mention a channel and a role.');
        }

        const serverId = message.guild.id;
        const roleId = roleMention.id;

        try {
            await Key.update(
                { roleId },
                { where: { serverId } }
            );

            const verifyButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Verify')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${message.client.user.id}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`),
                    new ButtonBuilder()
                        .setLabel('Add Bot')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${message.client.user.id}`)

                );

            const manualButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('manual-verify')
                        .setLabel('Manual Verification')
                        .setStyle(ButtonStyle.Primary)
                );

            const embed = new EmbedBuilder()
                .setTitle('Verification')
                .setDescription('Click the button below to verify and get the role!\nIf you also use the `Add Bot` button and add it to your user, this means if you leave the server we can contact you!')
                .setFooter({ text: 'we as in EstopiaRestore'});

            await channelMention.send({
                embeds: [embed],
                components: [verifyButton, manualButton]
            });

            await message.reply('Verification button sent to the channel.');
        } catch (error) {
            console.error('Error handling verify command:', error);
            await message.reply('Failed to store the role ID.');
        }
    }
};
