const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Panels } = require('../models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Setup a verification Panel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ticket')
                .setDescription('Use this to create a ticket verification panel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send the verification panel')
                        .addChannelTypes([0])
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to give when verified')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('catergory')
                        .setDescription('The catergory to create the ticket in')
                        .addChannelTypes([4])
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('pingrole')
                        .setDescription('The role to ping when a ticket is created')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('plain')
                .setDescription('Use this to create a plain verification panel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send the verification panel')
                        .addChannelTypes([0])
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to give when verified')
                        .setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channelMention = interaction.options.getChannel('channel');
        const roleMention = interaction.options.getRole('role');
        let type = 'Plain';
        if(interaction.options.getSubcommand() === 'ticket') {
            const catergory = interaction.options.getChannel('catergory');
            const pingrole = interaction.options.getRole('pingrole');
            
            type = `Ticket-${catergory.id}-${pingrole.id}`;
        }

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
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('how_it_works')
                        .setLabel('How it Works')
                        .setStyle(ButtonStyle.Secondary)
                );

            let embed;
            if(type.includes('Ticket')) {
                embed = new EmbedBuilder()
                    .setTitle('Verification')
                    .setDescription(`Click the button below to start verify for <@&${roleId}>!\nOnce you press the \`Verify\` button, use the \`Manual Verication\' Button.\nThis will create a ticket for you to verify.`)
                    .setFooter({ text: 'we as in EstopiaRestore'});
            } else {
                embed = new EmbedBuilder()
                    .setTitle('Verification')
                    .setDescription(`Click the button below to verify and get <@&${roleId}>!\nOnce you press the \`Verify\` button, use the \`Manual Verication\' Button.`)
                    .setFooter({ text: 'we as in EstopiaRestore'});
            }

            const message = await channelMention.send({
                embeds: [embed],
                components: [verifyButton, manualButton]
            });

            await Panels.create({
                guildId: serverId,
                channelId: channelMention.id,
                roleId: roleId,
                messageId: message.id,
                type: type
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
