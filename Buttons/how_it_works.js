require('dotenv').config();
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'how_it_works',
    description: 'Explains how the bot works',
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('How it Works (Information)')
            .setDescription('This is a Discord Bot Verification Bot. *Similar to RestoreCord Diffrences Below*')
            .addFields(
                { name: 'Open Source', value: 'This bot is open source and can be found [here](https://github.com/kezza2k7/RestoreEstopia)' },
                { name: 'Confirmation on Leave', value: 'When/if you leave the server, you will be asked to confirm that you want to leave.*' },
                { name: 'Data Removal', value: 'You can remove your data from the server at any time by leaving and pressing `Remove Your Data` Button in the confirmation message.*' },
                { name: 'Auto Data Removal', value: 'If you leave the server, your data will be removed after 7 days.' },
                { name: 'Rejoin Server', value: 'You can rejoin the server at any time by pressing the `Join Server` Button in the confirmation message.*' },
                { name: 'ReAdding', value: `The server cannot re-add you after 7 days or after you press the \`Remove Your data\` Button*, The server also cannot add you back to the same server you left\n-# Aka they could create a new discord server and invite you, but they cannot use the one that you left.` }
            )
            .setFooter({ text: '* This may only work if you also add the bot to your own user.' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}