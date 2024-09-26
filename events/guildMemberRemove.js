const { ApprovedUsers } = require('../models');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js')

module.exports = {
    name: "guildMemberRemove",
    execute: async (member) => {
        try {
            const { user, guild } = member;

            const approvedUser = await ApprovedUsers.findOne({ where: { userId: user.id, serverId: guild.id } });
            if (!approvedUser) return;

            const removeButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setLabel('Remove Your Data')
                .setCustomId(`remove_data-${guild.id}`)
            
            const JoinServerButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel('Join Server')
                .setCustomId(`join_server-${guild.id}`)

            const row = new ActionRowBuilder()
                .addComponents(removeButton)
                .addComponents(JoinServerButton)

            const embed = new EmbedBuilder()
                .setTitle('Leave Detected')
                .setDescription(`It looks like you have left ${guild.name}(${guild.id}).

To protect the server against potential raids, the server may use your data to automatically re-add you within the next 7 days. You can also rejoin manually using the "Join Server" button. After 7 days, all your data will be removed and this option will no longer be available to the server owner, The "Join Server" button may still work.

If you want to remove your data immediately and prevent automatic re-adding, click the "Remove Your Data" button.`)
                .setTimestamp()
                
            try {
                user.send({ embeds: [embed], components: [row] })
                    .catch(error => {
                        
                    });
            } catch (error) {
                console.error('Error sending leave button:', error);
            }

            setTimeout(async () => {
                try {
                    // Check if the entry was created more than 7 days ago
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                    if (approvedUser.createdAt < sevenDaysAgo) {
                        await ApprovedUsers.destroy({ where: { userId: user.id, serverId: guild.id } });
                        console.log(`Member ${user.tag} removed from ApprovedUsers after one week`);
                    } else {
                        console.log(`Member ${user.tag} was not removed because the entry is less than 7 days old`);
                    }
                } catch (error) {
                    console.error('Error removing member from ApprovedUsers:', error);
                }
            }, 7 * 24 * 60 * 60 * 1000);

        } catch (error) {
            console.error('Error removing member from temp.db:', error);
        }
    }
};
