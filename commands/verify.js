const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Panels } = require('../models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Setup a verification Panel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the verification panel')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to give when verified')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channelMention = interaction.options.getChannel('channel');
        const roleMention = interaction.options.getRole('role');

        if (!channelMention || !roleMention) {
            return interaction.reply({ content: 'You need to mention a channel and a role.', ephemeral: true });
        }

        const serverId = interaction.guild.id;
        const roleId = roleMention.id;

        try {
            const verifyButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Verify')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`),
                    new ButtonBuilder()
                        .setLabel('Add Bot')
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}`)

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

            const message = await channelMention.send({
                embeds: [embed],
                components: [verifyButton, manualButton]
            });

            await Panels.create({
                guildId: serverId,
                channelId: channelMention.id,
                roleId: roleId,
                messageId: message.id
            });

            const SucessEmbed = new EmbedBuilder()
                .setTitle('Verification Panel Created')
                .setDescription('Verification panel has been created successfully.');

            await interaction.reply({ embeds: [SucessEmbed], ephemeral: true });
        } catch (error) {
            console.error('Error handling verify command:', error);
            await interaction.reply('Failed to store the role ID.');
        }
    }
};
