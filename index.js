const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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

  if (command === 'warn') {
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
    if (!member) return message.reply('Geef een gebruiker op om te waarschuwen.');
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply('Je hebt geen permissie om te waarschuwen.');

    message.channel.send(`${member} is gewaarschuwd. Reden: ${reason}`);
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
  }

  else if (command === 'unban') {
    const userId = args[0];
    if (!userId) return message.reply('Geef een gebruikers-ID op.');
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
      return message.reply('Je hebt geen permissie om te unbannen.');

    try {
      await message.guild.members.unban(userId);
      message.channel.send(`Gebruiker met ID ${userId} is unbanned.`);
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
        { name: '!help', value: 'Toon dit hulpoverzicht.' }
      )
      .setColor(0xff5733)
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  }
});

client.login(token);
