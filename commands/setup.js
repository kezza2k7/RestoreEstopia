const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Servers } = require('../models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup RestoreEstopia')
        .addSubcommand(subcommand =>
            subcommand
                .setName('context')
                .setDescription('Use this to setup the Context Menus')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('This is the channel you want the prove to send to')
                        .addChannelTypes([0])
                        .setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if(interaction.options.getSubcommand() === 'context') {
            const server = await Servers.findByPk(interaction.guild.id);
            const channelId = interaction.options.getChannel('channel').id;


            if(!server){
                let data = {
                    contextChanneld: channelId
                }

                await Servers.create({ serverId: interaction.guild.id, data: JSON.stringify(data) });
            } else {
                const data = JSON.parse(server.data)
                data.contextChanneld = channelId;
                server.data = JSON.stringify(data);
                await Servers.update({ serverId: interaction.guild.id, data: data }, { where: { serverId: interaction.guild.id } });
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Setup Complete')
                .setDescription(`Context Menus have been setup and set to <#${channelId}>`)
                .setTimestamp();

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
