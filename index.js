const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log(`Bot is online als ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
    if (message.content === '!hallo') {
        message.channel.send('Hoi daar!');
    }
});

client.login(process.env.TOKEN);
