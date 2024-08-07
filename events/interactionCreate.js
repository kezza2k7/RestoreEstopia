require('dotenv').config();
const { Key, AuthedUsers, ApprovedUsers, PendingUsers } = require('../models');
const { getValidToken, addUserToGuild } = require('../utils');
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

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

                const ValidToken = await getValidToken(accessToken, refreshToken);
                
                if(!ValidToken) return await interaction.reply({content: 'Your access token is invalid and your data has been removed.', ephemeral: true});

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
                    return interaction.reply({content: 'Error: Premissions.\n The Bot needs ot be higher on the role higharchy', ephemeral: true});
                }
                
                await PendingUsers.destroy({ where: { userId: user.id, serverId: guild.id } });
                await interaction.reply({content: 'You have been authorized', ephemeral: true});
                if(!ApprovedUser){
                    await ApprovedUsers.create({ userId: user.id, serverId: guild.id });
                }
            } catch (error) {
                console.error('Error fetching AuthedUser:', error);
                return interaction.reply('An error occurred while fetching your data.');
            }
        } else if (interaction.customId.includes('join_server-')) {
            const parts = interaction.customId.split('-');

            const guildId = parts[1];

            const user = interaction.user;

            const Autheduser = await AuthedUsers.findByPk(user.id);

            if (!Autheduser) {
                const VerifyButton = new ButtonBuilder()
                    .setLabel('Verify')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`)

                const row = new ActionRowBuilder()
                    .addComponents(VerifyButton);

                return await interaction.reply({content: 'Use the button below to ReVerify.', ephemeral: true, components: [row]});
            }

            const accessToken = Autheduser.accessToken;
            const refreshToken = Autheduser.refreshToken;

            const ValidToken = await getValidToken(accessToken, refreshToken, user.id, guildId);

            if (!ValidToken) {
                await AuthedUsers.destroy({ where: { userId: user.id } });
                return await interaction.reply({content: 'Your access token is invalid. Press the Join Button again.', ephemeral: true});
            }

            let results = await addUserToGuild(guildId, user.id, ValidToken);
            if(results){
                await interaction.reply({content: 'You have been added to the server.', ephemeral: true});
            } else {
                await interaction.reply({content: 'An error occurred while adding you to the server.', ephemeral: true});
            }
        } else if (interaction.customId.includes('remove_data-')) {
            const parts = interaction.customId.split('-');

            const guildId = parts[1];

            const user = interaction.user;

            const Autheduser = await AuthedUsers.findByPk(user.id);

            if (!Autheduser) {
                const VerifyButton = new ButtonBuilder()
                    .setLabel('Verify')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`)

                const row = new ActionRowBuilder()
                    .addComponents(VerifyButton);

                return await interaction.reply({content: 'You are not authorized. Verify again to use this Button.', ephemeral: true, components: [row]});
            }

            const accessToken = Autheduser.accessToken;
            const refreshToken = Autheduser.refreshToken;

            const ValidToken = await getValidToken(accessToken, refreshToken, user.id, guildId);

            if (!ValidToken) {
                const VerifyButton = new ButtonBuilder()
                    .setLabel('Verify')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join`)

                const row = new ActionRowBuilder()
                    .addComponents(VerifyButton);

                return await interaction.reply({content: 'Your access token is invalid. erify again to use this Button.', ephemeral: true, components: [row]});
            }

            let ApprovedUser = await ApprovedUsers.findOne({ where: { userId: user.id, serverId: guildId } });
            let PendingUser = await PendingUsers.findOne({ where: { userId: user.id, serverId: guildId } });

            if (!ApprovedUser && !PendingUser) {
                return await interaction.reply({content: `You have no Data Linked to the Server to Remove`, ephemeral: true});
            }

            await ApprovedUsers.destroy({ where: { userId: user.id, serverId: guildId } });
            await PendingUsers.destroy({ where: { userId: user.id, serverId: guildId } });

            const embed = new EmbedBuilder()
                .setTitle('Data Removed')
                .setDescription('Your data has been removed from the server.')
                .setTimestamp();

            await interaction.reply({ephemeral: true, embeds: [embed]});
        }
    }
};
