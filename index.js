const { Client, GatewayIntentBits, Partials, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();
const token = process.env.TOKEN;
const prefix = '!';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`✅ Bot is ingelogd als ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'kick') {
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!member) return message.reply('Geef een geldige gebruiker op.');
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers))
      return message.reply('Je hebt geen permissie om iemand te kicken.');

    try {
      await member.kick(reason);
      message.channel.send(`${member.user.tag} is gekickt. Reden: ${reason}`);
    } catch (err) {
      console.error(err);
      message.reply('Kon gebruiker niet kicken.');
    }
  }

  else if (command === 'ban') {
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!member) return message.reply('Geef een geldige gebruiker op.');
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
      return message.reply('Je hebt geen permissie om iemand te bannen.');

    try {
      await member.ban({ reason });
      message.channel.send(`${member.user.tag} is verbannen. Reden: ${reason}`);
    } catch (err) {
      console.error(err);
      message.reply('Kon gebruiker niet bannen.');
    }
  }

  else if (command === 'help') {
    message.channel.send(`
📋 **Command lijst:**
\`!kick @gebruiker [reden]\` - Kick een gebruiker
\`!ban @gebruiker [reden]\` - Ban een gebruiker
\`!help\` - Toon dit bericht
    `);
  }

  // Voeg hier andere commands zoals !warn, !clear toe indien gewenst
});

client.login(token);
