const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField, ActivityType } = require('discord.js');
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

// ✅ Status instellen zodra de bot klaar is
client.on('ready', () => {
  console.log(`✅ Ingelogd als ${client.user.tag}`);

  client.user.setActivity('Just JanCarlos op Youtube', { type: ActivityType.Watching });
});

const fs = require('fs');
let levels = require('./levels.json');

const cooldowns = new Map(); // Cooldown map

function getXPRequired(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const userId = message.author.id;

  // Check cooldown
  if (cooldowns.has(userId)) return;

  if (!levels[userId]) {
    levels[userId] = { xp: 0, level: 1 };
  }

  levels[userId].xp += 20;

  const neededXP = getXPRequired(levels[userId].level + 1);
  if (levels[userId].xp >= neededXP) {
    levels[userId].level += 1;
    levels[userId].xp = 0;

    message.channel.send(`🎉 ${message.author.username} is nu level ${levels[userId].level}!`);
  }

  // Save naar bestand
  fs.writeFile('./levels.json', JSON.stringify(levels, null, 2), err => {
    if (err) console.error(err);
  });

  // Zet cooldown van 15 seconden
  cooldowns.set(userId, true);
  setTimeout(() => cooldowns.delete(userId), 15000);
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
      `Hoi ${user}, wat leuk dat je de officiële server van **Just JanCarlos** hebt gejoined!\n\n` +
      'Zorg ervoor dat je een kijkje neemt in de regels en chat lekker mee in onze **#general-chat**!\n\n' +
      '**Veel plezier!**'
    )
    .addFields({
  name: '📋 Handige commando\'s',
  value:
    '**`!ticket [reden]`** – Maak een ticket aan.\n' +
    '**`!close`** – Sluit de ticket.\n' +
    '**`!add @gebruiker`** – Voeg een gebruiker toe aan het ticket.\n' +
    '**`!remove @gebruiker`** – Verwijder een gebruiker uit de ticket.\n' +
    '**`!level`** – Laat jouw level zien.'+
    '**`!suggestion [suggestie]`** – Stuur een suggestie.'+
    '**`!justjancarlos`** – Stuur informatie over Just JanCarlos.'+
    '**`!coinflip`** – Speel kop of munt.**' +
     '**`!boosters`** – Laat de leden zien die de server hebben geboost.**' +
    '**`!help`** – Toon een lijst met beschikbare commando\'s.\n' +
    '**`!info`** – Toon informatie over de bot.**'
  })
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

  // Vind het welkom-kanaal en stuur daar de embed
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
  const forbiddenWords = ['kanker', 'nigger', 'nigga', 'homo', 'flikker', 'neuk', 'neuken', 'fuck', 'fucking', 'kut', 'klootzak', 'idioot', 'idiot']; // vul je lijst aan
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

  // Verwijder het originele bericht
  await message.delete().catch(err => console.warn('Kon bericht niet verwijderen:', err));

  const logEmbed = new EmbedBuilder()
    .setTitle('📝 Embed aangemaakt')
    .addFields({ name: 'Auteur', value: message.author.tag })
    .setColor(0xff0000)
    .setTimestamp();

  await logToChannel(message.guild, logEmbed);
} 

      else if (command === 'level') {
  const user = message.mentions.users.first() || message.author;
  const userData = levels[user.id] || { level: 1, xp: 0 };
  const neededXP = getXPRequired(userData.level + 1);

  const embed = new EmbedBuilder()
    .setTitle(`🏅 Level info voor ${user.username}`)
    .addFields(
      { name: 'Level', value: `${userData.level}`, inline: true },
      { name: 'XP', value: `${userData.xp} / ${neededXP}`, inline: true }
    )
    .setColor(0xf1c40f);

  message.channel.send({ embeds: [embed] });
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
    
    else if (command === 'ticket') {
  const reason = args.join(' ') || 'Geen reden opgegeven';
  const ticketName = `ticket-${message.author.username.toLowerCase()}`;

  const existingChannel = message.guild.channels.cache.find(c => c.name === ticketName);
  if (existingChannel) {
    return message.reply('Je hebt al een open ticket.');
  }

  const ticketChannel = await message.guild.channels.create({
    name: ticketName,
    type: 0, // 0 = GUILD_TEXT
    permissionOverwrites: [
      {
        id: message.guild.id, // iedereen
        deny: ['ViewChannel'],
      },
      {
        id: message.author.id, // de gebruiker
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
      },
      {
        id: '1374718507194908825', // vervang dit door je echte staff role ID
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
}

else if (command === 'close') {
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

    setTimeout(() => channel.delete().catch(console.error), 5000);
  } catch (err) {
    return message.reply('Ticket sluiten geannuleerd.');
  }
}


else if (command === 'add') {
  const channel = message.channel;

  // Zorg dat dit alleen in ticketkanalen werkt
  if (!channel.name.startsWith('ticket-')) {
    return message.reply('Dit commando kan alleen in een ticketkanaal gebruikt worden.');
  }

  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('Je moet een gebruiker taggen die je wilt toevoegen aan het ticket.');
  }

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });

  message.reply(`✅ ${user.tag} is toegevoegd aan dit ticket.`);
}

  else if (command === 'remove') {
  const channel = message.channel;

  // Zorg dat dit alleen in ticketkanalen werkt
  if (!channel.name.startsWith('ticket-')) {
    return message.reply('Dit commando kan alleen in een ticketkanaal gebruikt worden.');
  }

  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('Je moet een gebruiker taggen die je wilt verwijderen uit het ticket.');
  }

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: false,
  });

  message.reply(`❌ ${user.tag} is verwijderd uit dit ticket.`);
}

else if (command === 'coinflip') {
  // Tijdelijke melding
  const loadingMessage = await message.channel.send('🪙 Gooit de munt...');

  // Wacht 2 seconden
  setTimeout(async () => {
    const outcome = Math.random() < 0.5 ? 'Kop 🪙' : 'Munt 🪙';

    const embed = new EmbedBuilder()
      .setTitle('🪙 Coinflip Resultaat')
      .setDescription('Je gooide de munt en het resultaat is...')
      .addFields({ name: 'Resultaat', value: `**${outcome}**` })
      .setColor(outcome.includes('Kop') ? 0xFFD700 : 0xC0C0C0)
      .setFooter({ text: 'Coinflip uitgevoerd door Just JanCarlos Bot' })
      .setTimestamp();

    await loadingMessage.edit({ content: '', embeds: [embed] });
  }, 2000);
}

  else if (command === 'boosters') {
  await message.guild.members.fetch(); // Zorg dat je alle leden hebt

  const boosters = message.guild.members.cache.filter(member => member.premiumSince);

  if (boosters.size === 0) {
    return message.channel.send('🚫 Er zijn momenteel geen boosters in de server.');
  }

  const boosterList = boosters.map(member => {
    const date = `<t:${Math.floor(member.premiumSince.getTime() / 1000)}:D>`; // Formatteer als Discord tijdstempel
    return `- ${member.user.tag} (sinds ${date})`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🚀 Server Boosters')
    .setDescription('Hieronder staan de geweldige mensen die deze server boosten 💜')
    .addFields({ name: '🌟 Boosters', value: boosterList })
    .setColor(0xf47fff)
    .setThumbnail('https://cdn.discordapp.com/emojis/850196989163167764.gif') // Aanpassen naar eigen icoon indien gewenst
    .setFooter({ text: 'Dankjewel aan alle boosters voor jullie support! 💜' })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}


  else if (command === 'rules') {
  const embed = new EmbedBuilder()
    .setTitle('📜 Serverregels')
    .setDescription(
      `1️⃣ **Respecteer iedereen**\n` +
      `Behandel anderen zoals je zelf behandeld wilt worden.\n` +
      `Geen haat, pesten, discriminatie of bedreigingen.\n` +
      `Dit kan resulteren in een waarschuwing of time-out.\n\n` +

      `2️⃣ **Geen spam of zelfpromotie**\n` +
      `Geen overmatig herhalen van berichten, capslock of onnodige mentions.\n` +
      `Zelfpromotie alleen in de daarvoor bestemde kanalen (als toegestaan).\n` +
      `Zie het waarschuwingssysteem in 📣updates of hieronder.\n\n` +

      `3️⃣ **Blijf on-topic**\n` +
      `Post berichten in de juiste kanalen.\n` +
      `Gebruik de juiste threads of secties voor specifieke onderwerpen.\n\n` +

      `4️⃣ **Geen NSFW of ongepaste content**\n` +
      `Geen 18+ content, gore, of ander ongepast materiaal.\n` +
      `Geen links naar illegale of schadelijke websites.\n` +
      `Plaatsen van ongepaste content zal resulteren in een ban.\n\n` +

      `5️⃣ **Gebruik gezond verstand**\n` +
      `Volg de instructies van de moderators en admins.\n` +
      `Geen misbruik van bots of exploits.\n` +
      `Niet luisteren is een timeout van de moderator.\n\n` +

      `6️⃣ **Houd het leuk en positief!**\n` +
      `Dit is een community voor fans van Just JanCarlos, laten we het gezellig houden!\n` +
      `Discussies mogen, maar houd het respectvol.\n\n` +

      `7️⃣ **Privacy en veiligheid**\n` +
      `Deel geen persoonlijke informatie.\n` +
      `Bescherm je eigen gegevens en die van anderen.\n` +
      `Doe je het toch dan zal je gekickt worden.\n\n` +

      `8️⃣ **Taalgebruik**\n` +
      `Gebruik gepast taalgebruik.\n` +
      `De hoofdtaal van de server is Nederlands, gebruik deze zoveel mogelijk.\n` +
      `English can be talked in 🇬🇧en-chat.\n\n` +

      `9️⃣ **Geen illegale activiteiten**\n` +
      `Geen piraterij, hacking of discussies over illegale activiteiten.\n` +
      `Respecteer auteursrechten en andere regels.\n` +
      `Blijf op de hoogte via 📣updates.\n\n` +

      `🔹 **Overtreden van deze regels kan leiden tot een time-out, kick of ban.**\n\n` +

      `📌 **Waarschuwingssysteem**\n` +
      `Als je een waarschuwing krijgt (dus wanneer je een regel overtreedt), stuurt @Just JanCarlos Bot je een berichtje.\n` +
      `Bij herhaling kun je gekickt, gemute of geband worden.`
    )
    .setColor(0xffcc00)
    .setFooter({ text: 'Lees en volg de regels om het gezellig te houden!' })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}

    
else if (command === 'justjancarlos') {
  const embed = new EmbedBuilder()
    .setTitle('🎬 Over Just JanCarlos')
    .setDescription(
      '**Just JanCarlos** is een Nederlandse content creator en YouTuber die bekend staat om zijn entertainment, humor en community-interacties!\n\n' +
      'Hij maakt video\'s over uiteenlopende onderwerpen zoals games, challenges en IRL content. Zijn positieve vibe en betrokkenheid met fans maken hem uniek.'
    )
    .addFields(
      { name: 'YouTube Kanaal', value: '[Klik hier](https://youtube.com/@justjancarlossabboneerff?si=zOEGmaW1a7Csxj4P)', inline: true },
      { name: 'TikTok', value: '[Klik hier](https://www.tiktok.com/@jcf.035?_t=ZG-8wcmIqMcurx&_r=1)', inline: true },
      { name: 'Discord Server', value: 'Je zit er al in! Veel plezier!', inline: true }
    )
  //  .setThumbnail('JJC_pfp.png') // Optioneel: Voeg zijn profielfoto/logo toe
    .setColor(0xff6600)
    .setFooter({ text: 'Informatie over Just JanCarlos' })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}


else if (command === 'giveaway') {
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply('Je hebt geen toestemming om deze command te gebruiken.');
  }

  const timeInput = args[0]; // bijv. '30s', '10m', '2h', '1d'
  const prize = args.slice(1).join(' ');

  if (!timeInput || !prize) {
    return message.reply('Gebruik: `!giveaway [tijd][s/m/h/d] [prijs]`\nBijvoorbeeld: `!giveaway 10m Nitro`');
  }

  // Parse tijd (zoals 10m → 600 seconden)
  const timeMatch = timeInput.match(/^(\d+)(s|m|h|d)$/);
  if (!timeMatch) {
    return message.reply('Ongeldige tijdsindeling. Gebruik `s` (seconden), `m` (minuten), `h` (uren) of `d` (dagen).');
  }

  const value = parseInt(timeMatch[1]);
  const unit = timeMatch[2];

  let duration = 0;
  switch (unit) {
    case 's':
      duration = value;
      break;
    case 'm':
      duration = value * 60;
      break;
    case 'h':
      duration = value * 60 * 60;
      break;
    case 'd':
      duration = value * 60 * 60 * 24;
      break;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎉 Giveaway!')
    .setDescription(`Prijs: **${prize}**\nReacteer met 🎉 om mee te doen!\nTijd: ${timeInput}`)
    .setColor(0x00bfff)
    .setTimestamp();

  const giveawayMessage = await message.channel.send({ embeds: [embed] });
  await giveawayMessage.react('🎉');

  setTimeout(async () => {
    await giveawayMessage.fetch();
    const reactions = giveawayMessage.reactions.cache.get('🎉');
    await reactions.users.fetch();

    const participants = reactions.users.cache.filter(user => !user.bot);
    if (participants.size === 0) {
      return message.channel.send('Geen deelnemers, geen winnaar.');
    }

    const winner = participants.random();
    message.channel.send(`🎊 Gefeliciteerd ${winner}! Je hebt **${prize}** gewonnen!`);
  }, duration * 1000);
}

else if (command === 'suggestion') {
  const suggestionText = args.join(' ');
  if (!suggestionText) return message.reply('Gebruik: `!suggestion [jouw suggestie]`');

  const embed = new EmbedBuilder()
    .setTitle('💡 Nieuwe Suggestie')
    .setDescription(suggestionText)
    .addFields({ name: 'Ingezonden door', value: message.author.tag })
    .setColor(0x00bfff)
    .setTimestamp();

  const suggestionChannel = message.guild.channels.cache.get('1375833571876540509');
  if (!suggestionChannel || !suggestionChannel.isTextBased()) {
    return message.reply('Suggestiekanaal niet gevonden of is geen tekstkanaal.');
  }

  // Stuur de embed naar het suggestiekanaal
  const suggestionMessage = await suggestionChannel.send({ embeds: [embed] });

  // Voeg automatische reacties toe
  await suggestionMessage.react('✅');
  await suggestionMessage.react('❌');
  await suggestionMessage.react('❓');

  await message.reply('✅ Jouw suggestie is verzonden naar het suggestiekanaal!');
}

  
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
      { name: 'Gemaakt door', value: 'JJC Developers', inline: true },
      { name: 'Servers actief', value: `${client.guilds.cache.size}`, inline: true },
      { name: 'Gebruikers', value: `${client.users.cache.size}`, inline: true },
      { name: 'Prefix', value: '`!`', inline: true },
      { name: 'Versie', value: '1.0.0', inline: true },
      { name: 'Node.js versie', value: `${process.version}`, inline: true },
      { name: 'Uptime na de nieuwste update', value: `${hours}u ${minutes}m ${seconds}s`, inline: true }
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
          { name: '!justjancarlos', value: 'Stuur informatie over Just JanCarlos.' },  
          { name: '!giveaway [tijd] [prijs]', value: 'Verwijder berichten.' },
          { name: '!embed [tekst]', value: 'Stuur een embed met jouw tekst.' },
          { name: '!boosters', value: 'Laat de leden zien die de server hebben geboost.' },
          { name: '!level', value: 'Laat jouw level zien.' },
          { name: '!poll [vraag]', value: 'Start een poll.' },
          { name: '!suggestion [suggestie]', value: 'Stuur een suggestie.' },
          { name: '!ticket [reden]', value: 'Maak een ticket aan.' },
          { name: '!add', value: 'Voeg een gebruiker toe aan de ticket.' },
          { name: '!remove', value: 'Verwijder een gebruiker uit de ticket.' },
          { name: '!coinflip', value: 'Speel kop of munt.' },
          { name: '!close', value: 'Sluit de ticket.' },
          { name: '!info', value: 'Stuurt informatie over de server.' }
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


client.login(process.env.TOKEN);
