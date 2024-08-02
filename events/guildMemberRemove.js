const { PendingUsers, ApprovedUsers } = require('../models');

module.exports = {
    name: "guildMemberRemove",
    execute: async (member) => {
        try {
            const { user, guild } = member;

            // Remove from PendingUsers immediately
            await PendingUsers.destroy({ where: { userId: user.id, serverId: guild.id } });

            const approvedUser = await ApprovedUsers.findOne({ where: { userId: user.id, serverId: guild.id } });
            if (!approvedUser) return;

            try {
                user.send({ content: 'It has been detected that you have left the server, To Protect the server if this is a Raid etc, they will be able to use the `Join Server for you` to the server in the next 7 days.\nOnce this passes the server will have no data of you and no way to use the `Join Server for you`.'});
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
