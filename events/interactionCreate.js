const path = require('path');
const querystring = require('querystring');
require('dotenv').config();
const fs = require('fs');
const { Key, AuthedUsers, ApprovedUsers, PendingUsers } = require('../models');
const fetch = require('node-fetch');

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
            console.log('Refresh token is valid. New access token:', data.access_token);
            return data;
        } else {
            // This will help in debugging
            const errorData = await response.json();
            console.error('Error response:', response.status, response.statusText);
            console.error('Error details:', errorData);
            return null;
        }
    } catch (error) {
        console.error('Request failed:', error);
        return null;
    }
}

module.exports = {
	name: 'interactionCreate',
	execute: async(interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'manual-verify') {
            const user = interaction.user;
            const guild = interaction.guild;

            try {
                const ApprovedUser = await ApprovedUsers.findOne({ where: { userId: user.id, serverId: guild.id } });

                let AuthedUser = await AuthedUsers.findByPk(user.id);

                if (!AuthedUser) {
                    return interaction.reply({content: 'Use the Verify', ephemeral: true});
                }

                const accessToken = AuthedUser.accessToken;
                const refreshToken = AuthedUser.refreshToken;

                const isAccessTokenValid = await testAccessToken(accessToken);

                if (!isAccessTokenValid) {
                    const newTokenData = await testRefreshToken(refreshToken);

                    if (newTokenData) {
                        AuthedUser = await AuthedUsers.update({
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

                        await interaction.reply({content: 'Your access token is invalid and your data has been removed.', ephemeral: true});
                        return;
                    }
                }

                const server = await Key.findOne({ where: { serverId: guild.id } });

                if (!server) {
                    return interaction.reply({content: 'This server is not authorized to use this command.', ephemeral: true});
                }

                const role = guild.roles.cache.get(server.roleId);

                if (!role) {
                    return interaction.reply({content: 'The role for this server is not found.', ephemeral: true});
                }

                let member = await guild.members.cache.get(user.id);
                if (!member) {
                    try {
                        member = await guild.members.fetch(user.id);
                    } catch (error) {
                        return interaction.reply({content: 'Member not found in server.', ephemeral: true});
                    }
                }
                try {
                    await member.roles.add(role);
                } catch (error) {
                    return interaction.reply({content: 'Error: Premissions', ephemeral: true});
                }
                
                await PendingUsers.destroy({ where: { userId: user.id, serverId: guild.id } });
                await interaction.reply({content: 'Authed', ephemeral: true});
                if(!ApprovedUser){
                    await ApprovedUsers.create({ userId: user.id, serverId: guild.id });
                }
            } catch (error) {
                console.error('Error fetching AuthedUser:', error);
                return interaction.reply('An error occurred while fetching your data.');
            }
        }
    }
};
