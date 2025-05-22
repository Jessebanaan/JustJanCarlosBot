const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once('ready', () => {
  console.log(`✅ Bot is ingelogd als ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  const user = member.user;

  // Embed voor de DM
  const dmEmbed = new EmbedBuilder()
    .setTitle('Welkom bij Just JanCarlos!')
    .setDescription(
      `Hoi ${user}, wat leuk dat je de officiële server **Just JanCarlos** hebt gejoined!\n\n` +
      'Zorg ervoor dat je een kijkje neemt in de regels en chat lekker mee in onze **#general-chat**!\n\n' +
      '**Veel plezier!**'
    )
    .addFields({ name: 'Handige commando\'s', value: '`!ticket`\n`!close`\n`!help`\n`!info`' })
    .setColor(0x00bfff)
    .setFooter({ text: 'Just JanCarlos Bot' })
    .setTimestamp();

  // Embed voor het welkom-kanaal
  const channelEmbed = new EmbedBuilder()
    .setTitle('👋 Nieuw lid!')
    .setDescription(`Welkom in de server, ${user}!`)
    .addFields(
      { name: 'Gebruiker', value: `${user.tag}`, inline: true },
      { name: 'Tip', value: 'Bekijk zeker even de regels en zeg hallo in de chat!' }
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setColor(0x00ffcc)
    .setTimestamp();

  try {
    // Stuur DM
    await user.send({ embeds: [dmEmbed] });
    console.log(`✅ Welkomst-DM verzonden naar ${user.tag}`);
  } catch (err) {
    console.warn(`⚠️ Kon geen welkomst-DM sturen naar ${user.tag}: ${err.message}`);
  }

const welcomeChannel = member.guild.channels.cache.find(
  (c) => c.id === '1342207553324453908' && c.isTextBased?.()
);

  if (welcomeChannel) {
    try {
      await welcomeChannel.send({ embeds: [channelEmbed] });
      console.log(`✅ Welkomstbericht geplaatst in #welkom`);
    } catch (err) {
      console.error(`❌ Fout bij verzenden in #welkom: ${err.message}`);
        }
  }
});
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

   // ===== AUTO MODERATION SYSTEM =====
  const forbiddenWords = ['kanker', 'nigger', 'nigga', 'homo', 'flikker']; // vul je lijst aan
  const inviteRegex = /(discord\.gg\/|discordapp\.com\/invite\/)/gi;
  const everyoneMention = /@everyone|@here/gi;
  const blockedImageNames = ['racist', 'nazi', 'hitler', 'swastika']; // voeg aan op basis van bestandsnamen

  // 1. Verboden woorden filter
  for (const word of forbiddenWords) {
    if (message.content.toLowerCase().includes(word)) {
      await handleViolation('verboden woord', word, message);
      return;
    }
  }

  // 2. Invite links blokkeren
  if (inviteRegex.test(message.content)) {
    await handleViolation('invite link', 'Discord Invite', message);
    return;
  }

  // 3. @everyone / @here spam blokkeren
  if (everyoneMention.test(message.content)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.MentionEveryone)) {
      await handleViolation('massamention', '@everyone/@here', message);
      return;
    }
  }

  // 4. Afbeeldingen checken op naam/mime-type
  if (message.attachments.size > 0) {
    for (const [, attachment] of message.attachments) {
      const filename = attachment.name?.toLowerCase() || '';
      const mimetype = attachment.contentType || '';

      const isSuspiciousImage =
        blockedImageNames.some(bad => filename.includes(bad)) ||
        mimetype.includes('image') && (filename.includes('racist') || filename.includes('nazi'));

      if (isSuspiciousImage) {
        await handleViolation('ongepaste afbeelding', filename, message);
        return;
      }
    }
  }

  // ===== EINDE AUTO MOD =====



  const prefix = '!';
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    if (command === 'ban') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.reply('Je hebt geen toestemming om leden te bannen.');
      }

      const member = message.mentions.members.first();
      const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';
      if (!member) return message.reply('Geef een geldige gebruiker op om te bannen.');
      if (!member.bannable) return message.reply('Ik kan deze gebruiker niet bannen.');

      await member.ban({ reason });
      message.channel.send(`${member.user.tag} is verbannen. ✅`);

      const embed = new EmbedBuilder()
        .setTitle('🚫 Lid verbannen')
        .addFields(
          { name: 'Gebruiker', value: member.user.tag, inline: true },
          { name: 'Reden', value: reason, inline: true },
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setColor(0xff0000)
        .setTimestamp();

      await logToChannel(message.guild, embed);
    } 
    
    else if (command === 'unban') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.reply('Je hebt geen toestemming om leden te unbannen.');
      }

      const userId = args[0];
      if (!userId) return message.reply('Geef het ID van de gebruiker op om te unbannen.');

      const user = await client.users.fetch(userId);
      await message.guild.members.unban(user);

      message.channel.send(`${user.tag} is geunbanned. ✅`);

      const embed = new EmbedBuilder()
        .setTitle('✅ Lid geunbanned')
        .addFields(
          { name: 'Gebruiker ID', value: user.id, inline: true },
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setColor(0x00ff00)
        .setTimestamp();

      await logToChannel(message.guild, embed);
    } 

    else if (command === 'kick') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return message.reply('Je hebt geen toestemming om leden te kicken.');
      }

      const member = message.mentions.members.first();
      const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';

      if (!member) return message.reply('Geef een geldige gebruiker op om te kicken.');
      if (!member.kickable) return message.reply('Ik kan deze gebruiker niet kicken.');

      await member.kick(reason);
      message.channel.send(`${member.user.tag} is gekickt. ✅`);

      const embed = new EmbedBuilder()
        .setTitle('👢 Lid gekickt')
        .addFields(
          { name: 'Gebruiker', value: member.user.tag, inline: true },
          { name: 'Reden', value: reason, inline: true },
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setColor(0xffa500)
        .setTimestamp();

      await logToChannel(message.guild, embed);
    }

    else if (command === 'warn') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return message.reply('Je hebt geen toestemming om leden te waarschuwen.');
      }

      const member = message.mentions.members.first();
      const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';

      if (!member) return message.reply('Geef een geldige gebruiker op om te waarschuwen.');

      try {
        await member.send(`⚠️ Je bent gewaarschuwd in **${message.guild.name}**.\n**Reden:** ${reason}`);
      } catch (error) {
        message.channel.send('Kon geen DM sturen naar deze gebruiker. (DMs staan misschien uit)');
      }

      message.channel.send(`${member.user.tag} is gewaarschuwd. ⚠️`);

      const embed = new EmbedBuilder()
        .setTitle('⚠️ Waarschuwing')
        .addFields(
          { name: 'Gebruiker', value: member.user.tag, inline: true },
          { name: 'Reden', value: reason, inline: true },
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setColor(0xffff00)
        .setTimestamp();

      await logToChannel(message.guild, embed);
    }

    else if (command === 'mute') {
  if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
    return message.reply('Je hebt geen toestemming om leden te muten.');
  }

  const member = message.mentions.members.first();
  const duration = args[1]; // bijv. "10m" of "1h"
  const reason = args.slice(2).join(' ') || 'Geen reden opgegeven';

  if (!member) return message.reply('Geef een geldige gebruiker op om te muten.');
  if (!duration) return message.reply('Geef een geldige duur op, zoals `10m`, `1h`, `1d`.');
  if (!member.moderatable) return message.reply('Ik kan deze gebruiker niet muten.');

  // Duur converteren naar milliseconden
  const ms = require('ms'); // zorg dat je `ms` package hebt geïnstalleerd

  const timeInMs = ms(duration);
  if (!timeInMs || timeInMs < 5000 || timeInMs > 28 * 24 * 60 * 60 * 1000) {
    return message.reply('Geef een geldige duur tussen 5 seconden en 28 dagen.');
  }

  try {
    await member.timeout(timeInMs, reason);
    message.channel.send(`${member.user.tag} is gemute voor ${duration}. 🤐`);

    const embed = new EmbedBuilder()
      .setTitle('🤐 Lid gemute')
      .addFields(
        { name: 'Gebruiker', value: member.user.tag, inline: true },
        { name: 'Duur', value: duration, inline: true },
        { name: 'Reden', value: reason, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setColor(0xffc107)
      .setTimestamp();

    await logToChannel(message.guild, embed);
  } catch (error) {
    console.error(error);
    message.reply('Er is iets misgegaan bij het muten van deze gebruiker.');
  }
}


    else if (command === 'clear') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return message.reply('Je hebt geen toestemming om berichten te verwijderen.');
      }

      const count = parseInt(args[0]);
      if (isNaN(count) || count < 1 || count > 100) {
        return message.reply('Geef een geldig aantal berichten op tussen 1 en 100.');
      }

      await message.channel.bulkDelete(count, true);
      const confirmation = await message.channel.send(`🧹 ${count} berichten verwijderd.`);
      setTimeout(() => confirmation.delete().catch(() => {}), 3000);

      const embed = new EmbedBuilder()
        .setTitle('🧹 Berichten verwijderd')
        .addFields(
          { name: 'Aantal', value: `${count}`, inline: true },
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setColor(0xffa500)
        .setTimestamp();

      await logToChannel(message.guild, embed);
    } 
    
    else if (command === 'embed') {
      const tekst = args.join(' ');
      if (!tekst) return message.reply('Voeg tekst toe aan het embed bericht.');

      const embed = new EmbedBuilder()
        .setDescription(tekst)
        .setColor(0xff5733)
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });

      const logEmbed = new EmbedBuilder()
        .setTitle('📝 Embed aangemaakt')
        .addFields({ name: 'Auteur', value: message.author.tag })
        .setColor(0xff0000)
        .setTimestamp();

      await logToChannel(message.guild, logEmbed);
    } 
    
    else if (command === 'poll') {
      const pollText = args.join(' ');
      if (!pollText) return message.reply('Voeg een vraag toe voor de poll.');

      const embed = new EmbedBuilder()
        .setTitle('📊 Nieuwe Poll')
        .setDescription(pollText)
        .setColor(0x3498db)
        .setFooter({ text: `Poll gestart door ${message.author.tag}` });

      const pollMessage = await message.channel.send({ embeds: [embed] });
      await pollMessage.react('✅');
      await pollMessage.react('❌');

      const logEmbed = new EmbedBuilder()
        .setTitle('📊 Poll aangemaakt')
        .addFields(
          { name: 'Vraag', value: pollText },
          { name: 'Auteur', value: message.author.tag }
        )
        .setColor(0x3498db)
        .setTimestamp();

      await logToChannel(message.guild, logEmbed);
    } 

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    if (command === 'ticket') {
      const reason = args.join(' ') || 'Geen reden opgegeven';
      const ticketName = `ticket-${message.author.username.toLowerCase()}`;

      const existingChannel = message.guild.channels.cache.find(c => c.name === ticketName);
      if (existingChannel) {
        return message.reply('Je hebt al een open ticket.');
      }

      const ticketChannel = await message.guild.channels.create({
        name: ticketName,
        type: 0, // GUILD_TEXT
        permissionOverwrites: [
          {
            id: message.guild.id,
            deny: ['ViewChannel'],
          },
          {
            id: message.author.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
          },
          {
            id: '1374718507194908825', // jouw staff role ID
            allow: ['ViewChannel', 'SendMessages', 'ManageMessages'],
          },
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle('🎫 Nieuw ticket')
        .addFields(
          { name: 'Gebruiker', value: message.author.tag, inline: true },
          { name: 'Reden', value: reason, inline: true }
        )
        .setColor(0x00ffff)
        .setTimestamp();

      await ticketChannel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
      await logToChannel(message.guild, embed);

      message.reply(`✅ Ticket aangemaakt: ${ticketChannel}`);
    } else if (command === 'close') {
      const channel = message.channel;

      if (!channel.name.startsWith('ticket-')) {
        return message.reply('Dit commando kan alleen in een ticketkanaal gebruikt worden.');
      }

      const confirm = await message.reply('Weet je zeker dat je dit ticket wilt sluiten? Typ `!bevestig` binnen 15 seconden.');

      const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === '!bevestig';
      try {
        await channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });

        await channel.send('🎟️ Ticket wordt gesloten...');

        const embed = new EmbedBuilder()
          .setTitle('🎟️ Ticket gesloten')
          .addFields(
            { name: 'Kanaal', value: channel.name, inline: true },
            { name: 'Gesloten door', value: message.author.tag, inline: true }
          )
          .setColor(0xff0000)
          .setTimestamp();

        await logToChannel(message.guild, embed);
        await channel.delete();
      } catch (err) {
        message.reply('❌ Ticket sluiten geannuleerd (geen bevestiging ontvangen).');
      }
    }
  } catch (err) {
    console.error(`❌ Er trad een fout op bij het verwerken van het commando: ${err.message}`);
  }
});
  

else if (command === 'info') {
  const uptime = process.uptime(); // seconden
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const embed = new EmbedBuilder()
    .setTitle('🤖 Just JanCarlos Bot Info')
    .setDescription('Hier is wat informatie over deze bot.')
    .addFields(
      { name: 'Bot naam', value: `${client.user.username}`, inline: true },
      { name: 'Gemaakt door', value: 'Just JanCarlos Developers', inline: true },
      { name: 'Servers actief', value: `${client.guilds.cache.size}`, inline: true },
      { name: 'Gebruikers', value: `${client.users.cache.size}`, inline: true },
      { name: 'Prefix', value: '`!`', inline: true },
      { name: 'Versie', value: '1.0.0', inline: true },
      { name: 'Node.js versie', value: `${process.version}`, inline: true },
      { name: 'Uptime na de nieuweste update', value: `${hours}u ${minutes}m ${seconds}s`, inline: true }
    )
    .setThumbnail(client.user.displayAvatarURL())
    .setColor(0x7289da)
    .setFooter({ text: 'Bedankt voor het gebruiken van de bot!' })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}

  
    else if (command === 'help') {
      const embed = new EmbedBuilder()
        .setTitle('📖 Help Menu')
        .setDescription('Hier is een lijst met beschikbare commands:')
        .addFields(
          { name: '!ban @gebruiker [reden]', value: 'Verban een gebruiker.' },
          { name: '!unban [gebruiker ID]', value: 'Unban een gebruiker.' },
          { name: '!kick @gebruiker [reden]', value: 'Kick een gebruiker.' },
          { name: '!warn @gebruiker [reden]', value: 'Waarschuw een gebruiker.' },
          { name: '!mute @gebruiker [tijd]', value: 'Mute een gebruiker.' },
          { name: '!clear [aantal]', value: 'Verwijder berichten.' },
          { name: '!embed [tekst]', value: 'Stuur een embed met jouw tekst.' },
          { name: '!poll [vraag]', value: 'Start een poll.' },
          { name: '!ticket [reden]', value: 'Maak een ticket aan.' },
          { name: '!close', value: 'Sluit een ticket' },
          { name: '!info', value: 'Stuurt informatie over de server' }
        )
        .setColor(0x00bfff)
        .setFooter({ text: 'Just JanCarlos Bot' })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    }

  } catch (err) {
    console.error(err);
    message.reply('Er is een fout opgetreden tijdens het uitvoeren van het commando.');
  }
});

async function logToChannel(guild, embed) {
  const logChannelName = 'logs'; // Pas aan naar je echte logkanaal
  const logChannel = guild.channels.cache.find(channel => channel.name === logChannelName && channel.isTextBased());

  if (!logChannel) {
    console.warn(`⚠️ Logkanaal "${logChannelName}" niet gevonden in ${guild.name}.`);
    return;
  }

  try {
    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error(`❌ Fout bij het loggen in ${logChannelName}:`, err);
  }
}


async function handleViolation(type, trigger, message) {
  await message.delete().catch(() => {});
  
  // DM sturen
  try {
    await message.author.send(`⚠️ Je bericht in **${message.guild.name}** is verwijderd wegens **${type}**.\n**Inhoud/Trigger:** ${trigger}`);
  } catch (err) {
    console.warn(`⚠️ Kan geen DM sturen naar ${message.author.tag}: ${err.message}`);
  }

  // Publieke waarschuwing
  const warning = await message.channel.send({
    content: `${message.author}, je bericht is verwijderd wegens **${type}**.`,
    allowedMentions: { users: [message.author.id] }
  });
  setTimeout(() => warning.delete().catch(() => {}), 5000);

  // Log naar kanaal
  const embed = new EmbedBuilder()
    .setTitle('🚨 AutoMod Ingrepen')
    .addFields(
      { name: 'Gebruiker', value: message.author.tag, inline: true },
      { name: 'Soort overtreding', value: type, inline: true },
      { name: 'Trigger', value: trigger, inline: false },
      { name: 'Kanaal', value: `<#${message.channel.id}>`, inline: true }
    )
    .setColor(0xff0000)
    .setTimestamp();

  await logToChannel(message.guild, embed);
}

  } catch (err) {
    console.error(err);
    message.reply('Er is een fout opgetreden tijdens het uitvoeren van het commando.');
  }
});


client.login(process.env.TOKEN);
