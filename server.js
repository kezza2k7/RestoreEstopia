const express = require('express');
const fetch = require('node-fetch');
const { AuthedUsers, WebUsers } = require('./models/index');
const { getValidTokenAPI } = require('./utils');

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

            return res.send('You have been verified, Please go back into the server and press the Manual Verification Button');
        } catch (error) {
            console.error('Error processing verification:', error);
            res.status(500).send('Internal server error');
        }
    });

    router.get('/web/auth', async (req, res) => {
        const code = req.query.code;
        if (!code) {
            return res.status(400).send('No code provided');
        }

        const Webuser = await WebUsers.findOne({
            where: {
                webToken: code
            }
        });

        if(!Webuser) {
            return res.status(404).send('No user found with that token');
        }

        if(Webuser.webTokenExpires < Date.now()) {
            return res.status(404).send('Token has expired');
        }

        const user = await AuthedUsers.findByPk(Webuser.userId);

        let token = await getValidTokenAPI(user.accessToken, user.refreshToken, user.userId);

        // Exchange the authorization code for an access token
        const params = new URLSearchParams();
        params.append('client_id', process.env.CLIENT_ID);
        params.append('client_secret', process.env.CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('code', token);
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
            res.send(userData);
        } catch (error) {
            console.error('Error processing verification:', error);
            res.status(500).send('Internal server error');
        }
    });


    router.post('/api/verifyToken', async (req, res) => {
        const { token } = req.body;

        if (!token) {
            return res.status(400).send(false);
        }

        const webUser = await WebUsers.findOne({
            where: {
                webToken: token
            }
        });

        if (!webUser) {
            return res.status(404).send(false);
        }

        if (webUser.webTokenExpire < Date.now()) {
            return res.status(404).send(false);
        }

        const user = await AuthedUsers.findByPk(webUser.userId);

        if (!user) {
            return res.status(404).send(false);
        }

        return res.send(true);
    })

    return router;
};

module.exports = createRouter;