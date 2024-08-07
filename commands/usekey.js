const { Key, ApprovedUsers, AuthedUsers } = require('../models');
require('dotenv').config();
const { addUserToGuild, getValidToken } = require('../utils');

module.exports = {
    name: 'usekey',
    description: 'Uses a key to get an invite link to the server',
    async execute(message, args) {
        if (args.length !== 1) {
            return message.reply('Usage: !usekey <key>');
        }

        const key = args[0];

        try {
            const keyEntry = await Key.findOne({ where: { key } });
            if (!keyEntry) {
                return message.reply('Invalid key.');
            }

            if(keyEntry.serverId == message.guild.id){
                return message.reply('You cannot use the key on this server.');
            }

            const members = await ApprovedUsers.findAll({ where: { serverId: keyEntry.serverId } });
            const memberIds = members.map(member => member.userId);
            
            for (const memberId of memberIds) {
                console.log(`Processing member: ${memberId}`);
                const user = await AuthedUsers.findByPk(memberId);
                if(!user){
                    console.warn(`User not found: ${memberId}`);
                    continue;
                }

                const accessToken = user.accessToken;
                const refreshToken = user.refreshToken;

                const validToken = await getValidToken(accessToken, refreshToken, memberId, keyEntry.serverId);

                await addUserToGuild(message.guild.id, memberId, validToken);
            }
        } catch (error) {
            console.error('Error processing usekey command:', error);
            await message.reply('An error occurred while processing your request.');
        }
    }
};

