require('dotenv').config();
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'close',
    description: 'Close a verification ticket',
    async execute(interaction) {
        if(!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            // User does not have the Manage Messages permission
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Permission Denied')
                .setDescription('You do not have permission to manage messages.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Channel Deletion')
            .setDescription('This channel will be deleted in 5 seconds.')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        setTimeout(() => {
            interaction.channel.delete();
        }, 5000); // 5000 milliseconds = 5 seconds
    }
}