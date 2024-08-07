const { Key } = require("../models");
const { generateKey } = require("../utils");

module.exports = {
    name: 'guildCreate',
    async execute(guild){
        const client = guild.client;
        const key = generateKey();
        const serverId = guild.id;
        const serverName = guild.name;
        const ownerId = guild.ownerId;
    
        try {
            // Delete old keys for the server
            await Key.destroy({ where: { serverId } });
    
            // Create new key entry
            await Key.create({ key, serverId, serverName, ownerId });
            console.log(`Key created for server ${serverName}: ${key}`);
    
            // Send key to the owner
            const owner = await client.users.fetch(ownerId);
            await owner.send(`Your ${serverName}(${serverId}) has been assigned a key: ${key}`);
        } catch (error) {
            console.error('Error handling guildCreate event:', error);
        }
    }

};