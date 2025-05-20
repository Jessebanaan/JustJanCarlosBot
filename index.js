const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Bot is online als ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // !warn @user reden
  if (command === 'warn') {
    const user = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply('Je hebt geen toestemming om te waarschuwen.');
    if (!user) return message.reply('Tag iemand om te waarschuwen.');

    message.channel.send(`${user} is gewaarschuwd. Reden: ${reason}`);
  }

  // !kick @user reden
  else if (command === 'kick') {
    const user = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return message.reply('Je hebt geen toestemming om te kicken.');
    if (!user || !user.kickable) return message.reply('Kan deze gebruiker niet kicken.');

    await user.kick(reason);
    message.channel.send(`${user.user.tag} is gekickt. Reden: ${reason}`);
  }

  // !ban @user reden
  else if (command === 'ban') {
    const user = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return message.reply('Je hebt geen toestemming om te bannen.');
    if (!user || !user.bannable) return message.reply('Kan deze gebruiker niet bannen.');

    await user.ban({ reason });
    message.channel.send(`${user.user.tag} is verbannen. Reden: ${reason}`);
  }

  // !unban gebruikers-id
  else if (command === 'unban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return message.reply('Je hebt geen toestemming om te unbannen.');
    const userId = args[0];
    if (!userId) return message.reply('Geef een gebruikers-ID op.');

    try {
      await message.guild.members.unban(userId);
      message.channel.send(`Gebruiker met ID ${userId} is unbanned.`);
    } catch (error) {
      message.reply('Kan deze gebruiker niet unbannen of is niet verbannen.');
    }
  }

  // !clear aantal
  else if (command === 'clear') {
    const amount = parseInt(args[0]);
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply('Je hebt geen toestemming om berichten te verwijderen.');
    if (isNaN(amount) || amount < 1 || amount > 100)
      return message.reply('Geef een geldig aantal op (1-100).');

    await message.channel.bulkDelete(amount, true);
    message.channel.send(`${amount} berichten verwijderd.`).then(msg => {
      setTimeout(() => msg.delete(), 3000);
    });
  }
});
