const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');

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

  if (command === 'warn') {
    const user = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply('Je hebt geen toestemming om te waarschuwen.');
    if (!user) return message.reply('Tag iemand om te waarschuwen.');

    message.channel.send(`${user} is gewaarschuwd. Reden: ${reason}`);
  }

  else if (command === 'kick') {
    const user = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
      return message.reply('Je hebt geen toestemming om te kicken.');
    if (!user || !user.kickable) return message.reply('Kan deze gebruiker niet kicken.');

    await user.kick(reason);
    message.channel.send(`${user.user.tag} is gekickt. Reden: ${reason}`);
  }

  else if (command === 'ban') {
    const user = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
      return message.reply('Je hebt geen toestemming om te bannen.');
    if (!user || !user.bannable) return message.reply('Kan deze gebruiker niet bannen.');

    await user.ban({ reason });
    message.channel.send(`${user.user.tag} is verbannen. Reden: ${reason}`);
  }

else if (command === 'unban') {
  if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
    return message.reply('Je hebt geen toestemming om te unbannen.');

  const userId = args[0];
  if (!userId) return message.reply('Geef een gebruikers-ID op.');

  try {
    // Eerst de lijst van gebande gebruikers ophalen
    const bans = await message.guild.bans.fetch();
    const bannedUser = bans.get(userId);

    if (!bannedUser) {
      return message.reply('Deze gebruiker is niet geband of het ID is ongeldig.');
    }

    // Als gebruiker geband is → unban
    await message.guild.members.unban(userId);
    message.channel.send(`Gebruiker met ID ${userId} is unbanned.`);
  } catch (error) {
    console.error(error);
    message.reply('Er is een fout opgetreden bij het unbannen.');
  }
}
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

  else if (command === 'help') {
    const helpEmbed = new EmbedBuilder()
      .setColor(0xff9980)
      .setTitle('📜 Hulp - Beschikbare Commands')
      .setDescription('Hier zijn de commando\'s die je kunt gebruiken met deze bot:')
      .addFields(
        { name: '!warn @gebruiker [reden]', value: 'Waarschuw een gebruiker.' },
        { name: '!kick @gebruiker [reden]', value: 'Kick een gebruiker uit de server.' },
        { name: '!ban @gebruiker [reden]', value: 'Ban een gebruiker permanent.' },
        { name: '!unban gebruikers-ID', value: 'Unban een gebruiker met hun ID.' },
        { name: '!clear aantal', value: 'Verwijder meerdere berichten tegelijk (1-100).' },
        { name: '!embed [bericht]', value: 'Verstuur het opgegeven bericht als een embed.' },
        { name: '!help', value: 'Toon dit helpbericht.' }
      )
      .setFooter({ text: 'Just JanCarlos Bot', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    message.channel.send({ embeds: [helpEmbed] });
  }

  else if (command === 'bans') {
  if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
    return message.reply('Je hebt geen toestemming om bans te bekijken.');
  }

  try {
    const bans = await message.guild.bans.fetch();

    if (bans.size === 0) {
      return message.channel.send('Er zijn momenteel geen gebande gebruikers.');
    }

    const banList = bans.map(ban => `${ban.user.tag} (ID: ${ban.user.id})`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('Gebande gebruikers')
      .setDescription(banList.length > 4000 ? 'Te veel bans om weer te geven.' : banList)
      .setColor(0xff9980)
      .setTimestamp();

    message.channel.send({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    message.reply('Er is iets misgegaan bij het ophalen van de bans.');
  }
}

else if (command === 'embed') {
  const embedMessage = args.join(' ');
  if (!embedMessage) return message.reply('Geef een bericht op om in een embed te plaatsen.');

  // Verwijder het originele bericht
  await message.delete().catch(() => {});

  // Maak en stuur de embed
  const embed = new EmbedBuilder()
    .setDescription(embedMessage)
    .setColor(0xff9980)
    .setFooter({ text: `Embed gemaakt door ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
    .setTimestamp();

  message.channel.send({ embeds: [embed] });
}
  
});

client.login(process.env.TOKEN);

client.on('error', console.error);
process.on('unhandledRejection', console.error);


