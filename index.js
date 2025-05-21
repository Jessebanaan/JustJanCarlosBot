const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const LOG_CHANNEL_NAME = 'logs'; // pas aan indien nodig

async function logToChannel(guild, embed) {
  const logChannel = guild.channels.cache.find(c => c.name === LOG_CHANNEL_NAME && c.isTextBased());
  if (logChannel) {
    logChannel.send({ embeds: [embed] });
  }
}

const token = process.env.TOKEN;
const prefix = '!';

function formatUptime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}d ${hours}u ${minutes}m ${seconds}s`;
}

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

  if (command === 'warn') {
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!member) return message.reply('Geef een gebruiker op om te waarschuwen.');
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply('Je hebt geen permissie om te waarschuwen.');

    message.channel.send(`${member} is gewaarschuwd. Reden: ${reason}`);

    const logEmbed = new EmbedBuilder()
  .setTitle('⚠️ Waarschuwing')
  .addFields(
    { name: 'Gebruiker', value: `${member.user.tag}`, inline: true },
    { name: 'Moderator', value: `${message.author.tag}`, inline: true },
    { name: 'Reden', value: reason }
  )
  .setColor(0xffcc00)
  .setTimestamp();
logToChannel(message.guild, logEmbed);

  }

  else if (command === 'kick') {
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!member) return message.reply('Geef een gebruiker op om te kicken.');
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers))
      return message.reply('Je hebt geen permissie om te kicken.');
    if (!member.kickable) return message.reply('Kan deze gebruiker niet kicken.');

    await member.kick(reason);
    message.channel.send(`${member.user.tag} is gekickt. Reden: ${reason}`);

    const logEmbed = new EmbedBuilder()
  .setTitle('👢 Gebruiker gekickt')
  .addFields(
    { name: 'Gebruiker', value: `${member.user.tag}`, inline: true },
    { name: 'Moderator', value: `${message.author.tag}`, inline: true },
    { name: 'Reden', value: reason }
  )
  .setColor(0xff0000)
  .setTimestamp();
logToChannel(message.guild, logEmbed);

  }

  else if (command === 'ban') {
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!member) return message.reply('Geef een gebruiker op om te bannen.');
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
      return message.reply('Je hebt geen permissie om te bannen.');
    if (!member.bannable) return message.reply('Kan deze gebruiker niet bannen.');

    await member.ban({ reason });
    message.channel.send(`${member.user.tag} is verbannen. Reden: ${reason}`);

    const logEmbed = new EmbedBuilder()
  .setTitle('👢 Gebruiker gebanned')
  .addFields(
    { name: 'Gebruiker', value: `${member.user.tag}`, inline: true },
    { name: 'Moderator', value: `${message.author.tag}`, inline: true },
    { name: 'Reden', value: reason }
  )
  .setColor(0xff0000)
  .setTimestamp();
logToChannel(message.guild, logEmbed);

  }

  else if (command === 'unban') {
    const userId = args[0];
    if (!userId) return message.reply('Geef een gebruikers-ID op.');
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
      return message.reply('Je hebt geen permissie om te unbannen.');

    try {
      await message.guild.members.unban(userId);
      message.channel.send(`Gebruiker met ID ${userId} is unbanned.`);

      const logEmbed = new EmbedBuilder()
  .setTitle('👢 Gebruiker gekickt')
  .addFields(
    { name: 'Gebruiker', value: `${member.user.tag}`, inline: true },
    { name: 'Moderator', value: `${message.author.tag}`, inline: true },
    { name: 'Reden', value: reason }
  )
  .setColor(0xff0000)
  .setTimestamp();
logToChannel(message.guild, logEmbed);

      
    } catch (err) {
      console.error(err);
      message.reply('Fout bij unbannen. ID correct?');
    }
  }

  else if (command === 'clear') {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount < 1 || amount > 100)
      return message.reply('Geef een getal tussen 1 en 100 op.');
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply('Je hebt geen permissie om berichten te verwijderen.');

    await message.channel.bulkDelete(amount, true);
    message.channel.send(`${amount} berichten verwijderd.`).then(msg => {
      const logEmbed = new EmbedBuilder()
  .setTitle('Beirchten verwijderd')
  .addFields(
    { name: 'Gebruiker', value: `${member.user.tag}`, inline: true },
    { name: 'Moderator', value: `${message.author.tag}`, inline: true },
    { name: 'Reden', value: reason }
  )
  .setColor(0xff0000)
  .setTimestamp();
logToChannel(message.guild, logEmbed);

      
      setTimeout(() => msg.delete(), 3000);
    });
  }

  else if (command === 'bans') {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
      return message.reply('Je hebt geen permissie om bans te bekijken.');

    const bans = await message.guild.bans.fetch();
    if (bans.size === 0) return message.channel.send('Er zijn geen gebande gebruikers.');

    const list = bans.map(ban => `${ban.user.tag} (ID: ${ban.user.id})`).join('\n');
    message.channel.send(list.length > 2000 ? 'Te veel gebande gebruikers om te tonen.' : list);
  }

  else if (command === 'embed') {
    const tekst = args.join(' ');
    if (!tekst) return message.reply('Geef een tekst voor de embed.');

    const embed = new EmbedBuilder()
      .setDescription(tekst)
      .setColor(0xff5733)
      .setTimestamp();

    message.channel.send({ embeds: [embed] });

    const logEmbed = new EmbedBuilder()
  .setTitle('Embed bericht gemaakt')
  .addFields(
    { name: 'Gebruiker', value: `${member.user.tag}`, inline: true },
    { name: 'Moderator', value: `${message.author.tag}`, inline: true },
    { name: 'Reden', value: reason }
  )
  .setColor(0xff0000)
  .setTimestamp();
logToChannel(message.guild, logEmbed);

  }

    else if (command === 'info') {
    const embed = new EmbedBuilder()
      .setTitle('ℹ️ Bot Informatie')
      .addFields(
        { name: 'Naam', value: `${client.user.tag}`, inline: true },
        { name: 'ID', value: `${client.user.id}`, inline: true },
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Gebruikers', value: `${client.users.cache.size}`, inline: true },
        { name: 'Versie', value: 'v1.0.0', inline: true },
        { name: 'Uptime', value: formatUptime(client.uptime), inline: true }
      )
      .setColor(0x3498db)
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: 'Bot door Just JanCarlos', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }

      else if (command === 'ping') {
  const msg = await message.channel.send('🏓 Pingen...');
  const latency = msg.createdTimestamp - message.createdTimestamp;
  msg.edit(`🏓 Pong! Latency: ${latency}ms | API: ${Math.round(client.ws.ping)}ms`);
}

else if (command === 'poll') {
  const vraag = args.join(' ');
  if (!vraag) return message.reply('❌ Je moet een vraag opgeven. Gebruik: `!poll Wat vind je van pizza?`');

  const embed = new EmbedBuilder()
    .setTitle('📊 Nieuwe Poll')
    .setDescription(vraag)
    .setColor(0x00bfff)
    .setFooter({ text: `Poll gestart door ${message.author.tag}` })
    .setTimestamp();

  const pollMsg = await message.channel.send({ embeds: [embed] });
  await pollMsg.react('👍');
  await pollMsg.react('👎');

  const logEmbed = new EmbedBuilder()
  .setTitle('Poll aangemaakt')
  .addFields(
    { name: 'Auteur', value: `${member.user.tag}`, inline: true },
    { name: 'Kanaal', value: `${message.author.tag}`, inline: true },
    { name: 'Vraag', value: vraag }
  )
  .setColor(0xff0000)
  .setTimestamp();
logToChannel(message.guild, logEmbed);

}
  
  else if (command === 'ticket') {
  const reason = args.join(' ') || 'Geen reden opgegeven';

  const supportRoleName = 'Support'; // pas dit aan naar je staff rolnaam
  const existing = message.guild.channels.cache.find(c => c.name === `ticket-${message.author.username.toLowerCase()}`);
  if (existing) return message.reply('Je hebt al een open ticket.');

  const supportRole = message.guild.roles.cache.find(r => r.name === supportRoleName);
  if (!supportRole) return message.reply(`De rol "${supportRoleName}" bestaat niet.`);

  const channel = await message.guild.channels.create({
    name: `ticket-${message.author.username}`,
    type: 0, // 0 = GUILD_TEXT
    permissionOverwrites: [
      {
        id: message.guild.id,
        deny: ['ViewChannel']
      },
      {
        id: message.author.id,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
      },
      {
        id: supportRole.id,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
      }
    ]
  });

  channel.send(`🎫 Ticket geopend door ${message.author}. Reden: ${reason}`);
  message.reply(`✅ Ticket aangemaakt: ${channel}`);

                                                                 const logEmbed = new EmbedBuilder()
  .setTitle('Ticket aangemaakt')
  .addFields(
    { name: 'Gebruiker', value: `${member.user.tag}`, inline: true },
    { name: 'Moderator', value: `${message.author.tag}`, inline: true },
    { name: 'Reden', value: reason }
  )
  .setColor(0xff0000)
  .setTimestamp();
logToChannel(message.guild, logEmbed);

  const reason = args.join(' ') || 'Geen reden opgegeven';

  const supportRoleName = 'Support'; // pas dit aan naar je staff rolnaam
  const existing = message.guild.channels.cache.find(c => c.name === `ticket-${message.author.username.toLowerCase()}`);
  if (existing) return message.reply('Je hebt al een open ticket.');

  const supportRole = message.guild.roles.cache.find(r => r.name === supportRoleName);
  if (!supportRole) return message.reply(`De rol "${supportRoleName}" bestaat niet.`);

  const channel = await message.guild.channels.create({
    name: `ticket-${message.author.username}`,
    type: 0, // 0 = GUILD_TEXT
    permissionOverwrites: [
      {
        id: message.guild.id,
        deny: ['ViewChannel']
      },
      {
        id: message.author.id,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
      },
      {
        id: supportRole.id,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
      }
    ]
  });

  channel.send(`🎫 Ticket geopend door ${message.author}. Reden: ${reason}`);
  message.reply(`✅ Ticket aangemaakt: ${channel}`);

                                                                 const logEmbed = new EmbedBuilder()
  .setTitle('Ticket aangemaakt')
  .addFields(
    { name: 'Gebruiker', value: `${member.user.tag}`, inline: true },
    { name: 'Moderator', value: `${message.author.tag}`, inline: true },
    { name: 'Reden', value: reason }
  )
  .setColor(0xff0000)
  .setTimestamp();
logToChannel(message.guild, logEmbed);

}

    else if (command === 'close') { // sluit de ticket
  if (!message.channel.name.startsWith('ticket-')) return message.reply('Dit is geen ticketkanaal.');
  message.channel.send('🎟️ Ticket wordt gesloten...').then(() => {
    setTimeout(() => message.channel.delete(), 3000);
  });
}

}

else if (command === 'close') {
  if (!message.channel.name.startsWith('ticket-')) return message.reply('Dit is geen ticketkanaal.');

  const logEmbed = new EmbedBuilder()
    .setTitle('🎟️ Ticket Gesloten')
    .addFields(
      { name: 'Kanaal', value: `${message.channel.name}`, inline: true },
      { name: 'Gesloten door', value: `${message.author.tag}`, inline: true }
    )
    .setColor(0xffa500)
    .setTimestamp();

  logToChannel(message.guild, logEmbed); // stuur log voordat kanaal wordt verwijderd

  message.channel.send

}

  else if (command === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('📜 Hulp - Commands')
      .addFields(
        { name: '!warn @user [reden]', value: 'Waarschuw een gebruiker.' },
        { name: '!kick @user [reden]', value: 'Kick een gebruiker.' },
        { name: '!ban @user [reden]', value: 'Ban een gebruiker.' },
        { name: '!unban [userID]', value: 'Unban een gebruiker via ID.' },
        { name: '!clear [aantal]', value: 'Verwijder berichten (1-100).' },
        { name: '!bans', value: 'Toon gebande gebruikers.' },
        { name: '!embed [tekst]', value: 'Stuur een embed met jouw tekst.' },
        { name: '!info', value: 'Toon informatie over de bot.' },
        { name: '!ping', value: 'Laat zien hoe snel de bot reageert.' },
        { name: '!poll', value: 'Start een poll met 👍/👎 stemmen.' },
        { name: '!ticket [reden]', value: 'Maak een support ticket aan.' },
        { name: '!close', value: 'Sluit het huidige ticketkanaal.' },
        { name: '!help', value: 'Toon dit hulpoverzicht.' }
      )
      .setColor(0xff5733)
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
});

client.login(token);
