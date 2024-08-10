const crypto = require('crypto');
const fetch = require('node-fetch');
const { AuthedUsers, ApprovedUsers } = require('./models/index.js');
const querystring = require('querystring');

function generateKey() {
    return crypto.randomBytes(16).toString('hex');
}

async function addUserToGuild(guildId, userId, accessToken) {
    console.log(`Adding ${userId} to server: ${guildId} with token: ${accessToken}`);
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
        } else if (response.status === 204) {
            console.log(`User is already in the server: ${userId}`);
            break; // Exit loop if user is already in the server
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
      return false;
    }

    return true;
  }

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

async function getValidToken(accessToken, refreshToken, userId, guildId){
    if(!accessToken || !refreshToken || !userId || !guildId){
        return null;
    }
    const isAccessTokenValid = await testAccessToken(accessToken);

    if (!isAccessTokenValid) {
        const newTokenData = await testRefreshToken(refreshToken);

        if (newTokenData) {
            user = await AuthedUsers.update({
                accessToken: newTokenData.access_token
            }, {
                where: { userId: userId }
            });
            return newTokenData.access_token;
        } else {
            await AuthedUsers.destroy({
                where: { userId: userId }
            });

            await ApprovedUsers.destroy({
                where: { userId: userId, serverId: guildId }
            });

            return null;
        }
    } else {
        return accessToken;
    }
}

async function getValidTokenAPI(accessToken, refreshToken, userId){
    if(!accessToken || !refreshToken || !userId || !guildId){
        return null;
    }
    const isAccessTokenValid = await testAccessToken(accessToken);

    if (!isAccessTokenValid) {
        const newTokenData = await testRefreshToken(refreshToken);

        if (newTokenData) {
            user = await AuthedUsers.update({
                accessToken: newTokenData.access_token
            }, {
                where: { userId: userId }
            });
            return newTokenData.access_token;
        } else {
            await AuthedUsers.destroy({
                where: { userId: userId }
            });

            return null;
        }
    } else {
        return accessToken;
    }
}

module.exports = { generateKey, addUserToGuild, testAccessToken, testRefreshToken, getValidToken, getValidTokenAPI };
