require('dotenv').config();
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'close_give_role',
    description: 'Close a verification ticket and give the role',
    async execute(interaction) {
        if(!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            // User does not have the Manage Messages permission
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Permission Denied')
                .setDescription('You do not have permission to manage messages.')
                .setTimestamp();

            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const description = interaction.message.embeds[0].data.description;
        const idPattern = /<@(\d+)>|<@&(\d+)>/g;
        
        let userId;
        let roleId;
        let match;
        while ((match = idPattern.exec(description)) !== null) {
            if (match[1]) {
                userId = match[1]; // User ID
            }
            if (match[2]) {
                roleId = match[2]; // Role ID
            }
        }
        
        const user = interaction.guild.members.cache.get(userId);
        const role = interaction.guild.roles.cache.get(roleId);

        if (!user) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('User Not Found')
                .setDescription('User not found in server.')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!role) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Role Not Found')
                .setDescription('The role for this server is not found.')
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try{
            await user.roles.add(role);

            const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Role Added')
            .setDescription(`<@&${roleId}> has been given to ${user}.\nThis channel will be deleted in 5 seconds.`)
            .setTimestamp();

            await interaction.reply({ embeds: [embed]});

            setTimeout(() => {
                interaction.channel.delete();
            }, 5000); // 5000 milliseconds = 5 seconds
        } catch (error) {
            try{
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Role Not Added')
                    .setDescription(`The <@&${roleId}> could not be added to <@${userId}>.`)
                    .setTimestamp();
                return interaction.reply({ embeds: [embed]});
            } catch (error) {
                console.log('Error handling close_give_role command:', error);
            }

        }

    }
}