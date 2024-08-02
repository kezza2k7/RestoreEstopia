const express = require('express');
const fetch = require('node-fetch');
const { AuthedUsers, Key, PendingUsers, ApprovedUsers } = require('./models/index');

const createRouter = (client) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        const code = req.query.code;
        if (!code) {
            return res.status(400).send('No code provided');
        }

        // Exchange the authorization code for an access token
        const params = new URLSearchParams();
        params.append('client_id', process.env.CLIENT_ID);
        params.append('client_secret', process.env.CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', process.env.REDIRECT_URI);

        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            return res.status(tokenResponse.status).send(tokenData);
        }

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;

        // Use the access token to get the user's identity
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            return res.status(userResponse.status).send(userData);
        }

        try {
            // Insert or update user in the database
            await AuthedUsers.upsert({
                userId: userData.id,
                username: userData.username,
                accessToken,
                refreshToken
            });

            // Check if the user is in the `need_authed` table
            const rows = await PendingUsers.findAll({
                where: { userId: userData.id }
            });

            if (rows.length === 0) {
                return res.status(404).send('You are not pending verification, If you believe this is an error, please contact the server owner. or use the Manual Button');
            }

            for (const row of rows) {
                const serverId = row.serverId;
                const server = await client.guilds.cache.get(serverId);
                if (!server) {
                    console.warn(`Server not found: ${serverId}`);
                    continue;
                }

                const keyEntry = await Key.findOne({ where: { serverId } });
                if (!keyEntry) {
                    console.warn(`Role ID not found for server: ${serverId}`);
                    continue;
                }

                
                let member = await server.members.cache.get(userData.id);
                if (!member) {
                    try {
                        member = await server.members.fetch(userData.id);
                    } catch (error) {
                        console.warn(`Member not found in server: ${serverId}`);
                        continue;
                    }
                }

                const roleId = keyEntry.roleId;
                const role = server.roles.cache.get(roleId);
                if (!role) {
                    console.warn(`Role not found in server: ${serverId}`);
                    continue;
                }

                try {
                    await member.roles.add(role);
                    await ApprovedUsers.create({ userId: userData.id, serverId: serverId });
                    await PendingUsers.destroy({ where: { userId: userData.id, serverId } });
                    console.log(`Role added to ${member.user.tag} in server ${serverId}`);
                } catch (error) {
                    console.error('Error adding role', error);
                }
            }

            res.send('You have been verified!');
        } catch (error) {
            console.error('Error processing verification:', error);
            res.status(500).send('Internal server error');
        }
    });

    return router;
};

module.exports = createRouter;