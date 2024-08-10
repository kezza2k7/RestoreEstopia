const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { Servers } = require('../models');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('sendProve')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const server = await Servers.findByPk(interaction.guild.id);
        const targetMessage = interaction.targetMessage;
        const targetId = targetMessage.author.id;

        let embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(`${targetMessage.author.username}`)
            .setDescription(targetMessage.content || 'No content available') // Provide a default description
            .setImage(targetMessage.attachments.first()?.url || null) // Ensure the URL is valid
            .setTimestamp();
        
        const data = JSON.parse(server.data);

        const channel = interaction.guild.channels.cache.get(data.contextChanneld);

        if(!channel) return interaction.reply({ content: 'Channel not found', ephemeral: true });

        await channel.send({ embeds: [embed], content: `<@${targetId}>` });

        return interaction.reply({ embeds: [embed], ephemeral: true, content: `<@${targetId}>` });
    }
};
