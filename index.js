require('dotenv').config(); // laad .env bestand

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`Bot is online als ${client.user.tag}`);
});

client.on('messageCreate', message => {
    if (message.content === '!hello') {
        message.channel.send('Hey there!');
    }
});

// Gebruik de token uit de omgeving, niet hardcoderen!
client.login(process.env.TOKEN);

