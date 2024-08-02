const { Key, ApprovedUsers, AuthedUsers } = require('../models');
const axios = require('axios');
require('dotenv').config();

async function testAccessToken(accessToken) {
    const url = 'https://discord.com/api/v10/users/@me';
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    if (response.ok) {
        return true;
    } else {
        return false;
    }
}

async function testRefreshToken(refreshToken) {
    const url = 'https://discord.com/api/v10/oauth2/token';
    
    const body = querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            // This will help in debugging
            const errorData = await response.json();
            return null;
        }
    } catch (error) {
        console.error('Request failed:', error);
        return null;
    }
}

async function addUserToGuild(guildId, userId, accessToken) {
    let response;
    const maxRetries = 5; // Maximum number of retries for handling rate limits
    let retries = 0;
  
    if (!guildId || !userId || !accessToken) {
      console.error('Invalid parameters. Make sure guildId, userId, and accessToken are provided.');
      return;
    }
  
    while (retries < maxRetries) {
      try {
        response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            access_token: accessToken
          })
        });
  
        if (response.status === 429) {
          // Rate limited; extract retry-after duration from the response headers
          const retryAfter = response.headers.get('retry-after') || 1000; // Default to 1 second if header is not present
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          retries++;
        } else if (response.ok) {
          break; // Exit loop on success
        } else {
          break; // Exit loop on error
        }
      } catch (error) {
        break; // Exit loop on exception
      }
    }
  
    if (retries === maxRetries) {
      console.error('Max retries reached. Failed to add user.');
    }
  }

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

                const isAccessTokenValid = await testAccessToken(accessToken);

                if (!isAccessTokenValid) {
                    const newTokenData = await testRefreshToken(refreshToken);

                    if (newTokenData) {
                        user = await AuthedUsers.update({
                            accessToken: newTokenData.access_token
                        }, {
                            where: { userId: user.id }
                        });
                    } else {
                        await AuthedUsers.destroy({
                            where: { userId: user.id }
                        });

                        await ApprovedUsers.destroy({
                            where: { userId: user.id, serverId: guild.id }
                        });

                        continue;
                    }
                }

                await addUserToGuild(keyEntry.serverId, memberId, user.accessToken);
            }
        } catch (error) {
            console.error('Error processing usekey command:', error);
            await message.reply('An error occurred while processing your request.');
        }
    }
};
