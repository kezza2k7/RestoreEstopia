const { PendingUsers } = require('../models');

module.exports = {
    name: "guildMemberAdd",
    execute: async (member) => {
        const { user, guild } = member;

        try {
            await PendingUsers.create({ userId: user.id, serverId: guild.id });
        } catch (error) {
            console.error('Error adding member to temp.db:', error);
        }
    }
};
