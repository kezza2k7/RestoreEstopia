const express = require('express');
const fetch = require('node-fetch');
const { AuthedUsers, WebUsers } = require('./models/index');
const { getValidTokenAPI } = require('./utils');
const bcrypt = require('bcrypt');

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

    router.post('/api/login', async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send('Missing parameters');
        }

        const passwordHash = bcrypt.hashSync(password, 10);

        const user = await AuthedUsers.findOne({
            where: {
                username,
                password: passwordHash
            }
        });

        if (!user) {
            return res.status(404).send('User not found');
        }

        const webToken = crypto.randomBytes(16).toString('hex');

        await WebUsers.upsert({
            userId: user.userId,
            webToken,
            webTokenExpire: Date.now() + 1000 * 60 * 60 * 24
        });

        res.cookie('authToken', webToken, { httpOnly: false, secure: true });

        return res.send(webToken);
    });

    router.post('/api/register', async (req, res) => {
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).send('Missing parameters');
        }

        const passwordHash = bcrypt.hashSync(password, 10);

        const user = await AuthedUsers.findOne({
            where: {
                username,
                password: passwordHash
            }
        });

        if (user) {
            return res.status(409).send('User already exists');
        }

        const webToken = crypto.randomBytes(16).toString('hex');

        await AuthedUsers.create({
            username,
            password: passwordHash,
            email,
            webToken,
            webTokenExpire: Date.now() + 1000 * 60 * 60 * 24
        });

        res.cookie('authToken', webToken, { httpOnly: false, secure: true });

        return res.send(webToken);
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

        return res.send(true);
    })

    return router;
};

module.exports = createRouter;