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
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.user.setActivity('GridSplit', { type: ActivityType.Watching });
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

    message.channel.send(`🎉 ${message.author.username} is now level ${levels[userId].level}!`);
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
  console.log(`✅ Bot is logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  const user = member.user;

  // Embed voor de DM
  const dmEmbed = new EmbedBuilder()
    .setTitle('Welkom to the official server of GridSplit!')
    .setDescription(
      `Hey ${user}, thanks for joining the Discord server of GridSplit!\n\n` +
      'Make sure to check our rules and chat with the community in **#general**!\n\n' +
      '**Have fun!**'
    )
    .addFields({
  name: '📋 Handy commands\'s',
  value:
    '**`!ticket [reason]`** – Make a ticket.\n' +
    '**`!close`** – Close the ticket.\n' +
    '**`!add @user`** – Add a user to the ticket.\n' +
    '**`!remove @user`** – Remove a user from the ticket.\n' +
    '**`!level`** – Shows your level.'+
    '**`!suggestion [suggestion]`** – Send a suggestion.'+
    '**`!coinflip`** – Play coinflip.**' +
     '**`!boosters`** – Shows a list of users that boosted the server.**' +
    '**`!help`** – Shows a list of handy commands.\n' +
    '**`!info`** – Shows information about the bot.**'
  })
    .setColor(0x00bfff)
    .setFooter({ text: 'GridSplit bot' })
    .setTimestamp();

  try {
    // Stuur DM
    await user.send({ embeds: [dmEmbed] });
    console.log(`✅ Welkomst-DM verzonden naar ${user.tag}`);
  } catch (err) {
    console.warn(`⚠️ Kon geen welkomst-DM sturen naar ${user.tag}: ${err.message}`);
  }


   // ===== AUTO MODERATION SYSTEM =====
  const forbiddenWords = ['kanker', 'nigger', 'nigga', 'homo', 'flikker', 'neuk', 'neuken', 'fuck', 'fucking', 'kut', 'klootzak', 'idioot', 'idiot']; // vul je lijst aan
  const inviteRegex = /(discord\.gg\/|discordapp\.com\/invite\/)/gi;
  const everyoneMention = /@everyone|@here/gi;
  const blockedImageNames = ['racist', 'nazi', 'hitler', 'swastika']; // voeg aan op basis van bestandsnamen

  // 1. Verboden woorden filter
  for (const word of forbiddenWords) {
    if (message.content.toLowerCase().includes(word)) {
      await handleViolation('Cursed word', word, message);
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
      await handleViolation('massmention', '@everyone/@here', message);
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
        await handleViolation('Inappropriate image
', filename, message);
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
        return message.reply('You have no permission to ban members.');
      }

      const member = message.mentions.members.first();
      const reason = args.slice(1).join(' ') || 'No reason';
      if (!member) return message.reply('Give a valid member to ban.');
      if (!member.bannable) return message.reply('I can not ban this user.');

      await member.ban({ reason });
      message.channel.send(`${member.user.tag} is banned. ✅`);

      const embed = new EmbedBuilder()
        .setTitle('🚫 Member banned.')
        .addFields(
          { name: 'User', value: member.user.tag, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setColor(0xff0000)
        .setTimestamp();

      await logToChannel(message.guild, embed);
    } 
    
    else if (command === 'unban') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.reply('You have no permission to unban members.');
      }

      const userId = args[0];
      if (!userId) return message.reply('Give the ID of the user to unban.');

      const user = await client.users.fetch(userId);
      await message.guild.members.unban(user);

      message.channel.send(`${user.tag} is unbanned. ✅`);

      const embed = new EmbedBuilder()
        .setTitle('✅ Member unbanned')
        .addFields(
          { name: 'User ID', value: user.id, inline: true },
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setColor(0x00ff00)
        .setTimestamp();

      await logToChannel(message.guild, embed);
    } 

    else if (command === 'kick') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return message.reply('You have no permission to kick members.');
      }

      const member = message.mentions.members.first();
      const reason = args.slice(1).join(' ') || 'No reason';

      if (!member) return message.reply('Give a valid user to kick.');
      if (!member.kickable) return message.reply('Cannot kick this user.');

      await member.kick(reason);
      message.channel.send(`${member.user.tag} is kicked. ✅`);

      const embed = new EmbedBuilder()
        .setTitle('👢 Lid kicked')
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
        return message.reply('You have no permission to warn members.');
      }

      const member = message.mentions.members.first();
      const reason = args.slice(1).join(' ') || 'No reason';

      if (!member) return message.reply('Give a valid user to warn.');

      try {
        await member.send(`⚠️ Je bent gewaarschuwd in **${message.guild.name}**.\n**Reden:** ${reason}`);
      } catch (error) {
        message.channel.send('Could not send a DM to the members. (DMs may be turned off.)');
      }

      message.channel.send(`${member.user.tag} is warned. ⚠️`);

      const embed = new EmbedBuilder()
        .setTitle('⚠️ Warning')
        .addFields(
          { name: 'User', value: member.user.tag, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setColor(0xffff00)
        .setTimestamp();

      await logToChannel(message.guild, embed);
    }

    else if (command === 'mute') {
  if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
    return message.reply('You have no permission to mute members.');
  }

  const member = message.mentions.members.first();
  const duration = args[1]; // bijv. "10m" of "1h"
  const reason = args.slice(2).join(' ') || 'No reason';

  if (!member) return message.reply('Give a valid member to mute.');
  if (!duration) return message.reply('Give a valid time, like `10m`, `1h`, `1d`.');
  if (!member.moderatable) return message.reply('I can not mute this member.');

  // Duur converteren naar milliseconden
  const ms = require('ms'); // zorg dat je `ms` package hebt geïnstalleerd

  const timeInMs = ms(duration);
  if (!timeInMs || timeInMs < 5000 || timeInMs > 28 * 24 * 60 * 60 * 1000) {
    return message.reply('Please specify a valid duration between 5 seconds and 28 days.');
  }

  try {
    await member.timeout(timeInMs, reason);
    message.channel.send(`${member.user.tag} is muted for ${duration}. 🤐`);

    const embed = new EmbedBuilder()
      .setTitle('🤐 Member muted')
      .addFields(
        { name: 'User', value: member.user.tag, inline: true },
        { name: 'Time', value: duration, inline: true },
        { name: 'ReReasonden', value: reason, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setColor(0xffc107)
      .setTimestamp();

    await logToChannel(message.guild, embed);
  } catch (error) {
    console.error(error);
    message.reply('Something went wrong while muting this user.');
  }
}


    else if (command === 'clear') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return message.reply('You have no permissions to delete messages.');
      }

      const count = parseInt(args[0]);
      if (isNaN(count) || count < 1 || count > 100) {
        return message.reply('Give a valid amount of messages between 1 and 100.');
      }

      await message.channel.bulkDelete(count, true);
      const confirmation = await message.channel.send(`🧹 ${count} messages deleted.`);
      setTimeout(() => confirmation.delete().catch(() => {}), 3000);

      const embed = new EmbedBuilder()
        .setTitle('🧹 Message deleted')
        .addFields(
          { name: 'Amount', value: `${count}`, inline: true },
          { name: 'Moderator', value: message.author.tag, inline: true }
        )
        .setColor(0xffa500)
        .setTimestamp();

      await logToChannel(message.guild, embed);
    } 
    
   else if (command === 'embed') {
  const tekst = args.join(' ');
  if (!tekst) return message.reply('Add a text to the embed message.');

  const embed = new EmbedBuilder()
    .setDescription(tekst)
    .setColor(0xff5733)
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });

  // Verwijder het originele bericht
  await message.delete().catch(err => console.warn('Could not delete the message:', err));

  const logEmbed = new EmbedBuilder()
    .setTitle('📝 Embed created')
    .addFields({ name: 'Author', value: message.author.tag })
    .setColor(0xff0000)
    .setTimestamp();

  await logToChannel(message.guild, logEmbed);
} 

      else if (command === 'level') {
  const user = message.mentions.users.first() || message.author;
  const userData = levels[user.id] || { level: 1, xp: 0 };
  const neededXP = getXPRequired(userData.level + 1);

  const embed = new EmbedBuilder()
    .setTitle(`🏅 Level info about ${user.username}`)
    .addFields(
      { name: 'Level', value: `${userData.level}`, inline: true },
      { name: 'XP', value: `${userData.xp} / ${neededXP}`, inline: true }
    )
    .setColor(0xf1c40f);

  message.channel.send({ embeds: [embed] });
}

    
    else if (command === 'poll') {
      const pollText = args.join(' ');
      if (!pollText) return message.reply('Add a question to this poll.');

      const embed = new EmbedBuilder()
        .setTitle('📊 New poll')
        .setDescription(pollText)
        .setColor(0x3498db)
        .setFooter({ text: `Poll started by ${message.author.tag}` });

      const pollMessage = await message.channel.send({ embeds: [embed] });
      await pollMessage.react('✅');
      await pollMessage.react('❌');

      const logEmbed = new EmbedBuilder()
        .setTitle('📊 Poll created')
        .addFields(
          { name: 'Question', value: pollText },
          { name: 'Author', value: message.author.tag }
        )
        .setColor(0x3498db)
        .setTimestamp();

      await logToChannel(message.guild, logEmbed);
    } 
    
    else if (command === 'ticket') {
  const reason = args.join(' ') || 'No reason';
  const ticketName = `ticket-${message.author.username.toLowerCase()}`;

  const existingChannel = message.guild.channels.cache.find(c => c.name === ticketName);
  if (existingChannel) {
    return message.reply('You already have a opened ticket.');
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
        id: '1381568196225667173', // vervang dit door je echte staff role ID
        allow: ['ViewChannel', 'SendMessages', 'ManageMessages'],
      },
    ],
  });


  const embed = new EmbedBuilder()
    .setTitle('🎫 New ticket')
    .addFields(
      { name: 'User', value: message.author.tag, inline: true },
      { name: 'Reden', value: reason, inline: true }
    )
    .setColor(0x00ffff)
    .setTimestamp();

  await ticketChannel.send({ content: `<@${message.author.id}>`, embeds: [embed] });
  await logToChannel(message.guild, embed);

  message.reply(`✅ Ticket created: ${ticketChannel}`);
}

else if (command === 'close') {
  const channel = message.channel;

  if (!channel.name.startsWith('ticket-')) {
    return message.reply('This command can only be used in a ticket.');
  }

  const confirm = await message.reply('Are you sure you want to close this ticket? Type `!confirm` within 15 seconds.');

  const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === '!confirm';
  try {
    await channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] });
    
    await channel.send('🎟️ Ticket is closing...');
    
    const embed = new EmbedBuilder()
      .setTitle('🎟️ Ticket closed')
      .addFields(
        { name: 'Channel', value: channel.name, inline: true },
        { name: 'Closed by', value: message.author.tag, inline: true }
      )
      .setColor(0xff0000)
      .setTimestamp();

    await logToChannel(message.guild, embed);

    setTimeout(() => channel.delete().catch(console.error), 5000);
  } catch (err) {
    return message.reply('Closing ticket is cancelled.');
  }
}


else if (command === 'add') {
  const channel = message.channel;

  // Zorg dat dit alleen in ticketkanalen werkt
  if (!channel.name.startsWith('ticket-')) {
    return message.reply('This commands can only be used in a ticket.');
  }

  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('You need to tag a user you want to add to the ticket.');
  }

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });

  message.reply(`✅ ${user.tag} Is added to this ticket.`);
}

  else if (command === 'remove') {
  const channel = message.channel;

  // Zorg dat dit alleen in ticketkanalen werkt
  if (!channel.name.startsWith('ticket-')) {
    return message.reply('This command can only be used in a ticket.');
  }

  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('You need to tag a user you want to remove from the ticket.');
  }

  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: false,
  });

  message.reply(`❌ ${user.tag} is removed from this ticket.`);
}

  else if (command === 'boosters') {
  await message.guild.members.fetch(); // Zorg dat je alle leden hebt

  const boosters = message.guild.members.cache.filter(member => member.premiumSince);

  if (boosters.size === 0) {
    return message.channel.send('🚫 There are no boosters at the moment.');
  }

  const boosterList = boosters.map(member => {
    const date = `<t:${Math.floor(member.premiumSince.getTime() / 1000)}:D>`; // Formatteer als Discord tijdstempel
    return `- ${member.user.tag} (sinds ${date})`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🚀 Server Boosters')
    .setDescription('Below are the awesome people boosting this server 💜')
    .addFields({ name: '🌟 Boosters', value: boosterList })
    .setColor(0xf47fff)
    .setThumbnail('https://cdn.discordapp.com/emojis/850196989163167764.gif') // Aanpassen naar eigen icoon indien gewenst
    .setFooter({ text: 'Thanks to all the boosters for the support! 💜' })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}

else if (command === 'giveaway') {
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply('You have no permission to start a giveaway.');
  }

  const timeInput = args[0]; // bijv. '30s', '10m', '2h', '1d'
  const prize = args.slice(1).join(' ');

  if (!timeInput || !prize) {
    return message.reply('Use: `!giveaway [time][s/m/h/d] [prize]');
  }

  // Parse tijd (zoals 10m → 600 seconden)
  const timeMatch = timeInput.match(/^(\d+)(s|m|h|d)$/);
  if (!timeMatch) {
    return message.reply('Invalid time format. Use `s` (seconds), `m` (minutes), `h` (hours), or `d` (days).');
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
    .setDescription(`Prijs: **${prize}**\nReact with 🎉 to join!\nTimoe: ${timeInput}`)
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
      return message.channel.send('No participants, no winner.');
    }

    const winner = participants.random();
    message.channel.send(`🎊 Congratulations ${winner}! You won **${prize}** !`);
  }, duration * 1000);
}

else if (command === 'suggestion') {
  const suggestionText = args.join(' ');
  if (!suggestionText) return message.reply('Use: `!suggestion [Your suggustion]`');

  const embed = new EmbedBuilder()
    .setTitle('💡 New suggestion')
    .setDescription(suggestionText)
    .addFields({ name: 'Sent by', value: message.author.tag })
    .setColor(0x00bfff)
    .setTimestamp();

  const suggestionChannel = message.guild.channels.cache.get('1382037140787171472');
  if (!suggestionChannel || !suggestionChannel.isTextBased()) {
    return message.reply('Suggestion channel not found.');
  }

  // Stuur de embed naar het suggestiekanaal
  const suggestionMessage = await suggestionChannel.send({ embeds: [embed] });

  // Voeg automatische reacties toe
  await suggestionMessage.react('✅');
  await suggestionMessage.react('❌');
  await suggestionMessage.react('❓');

  await message.reply('✅ Your suggestion is sent to the suggestion channel!');
}

  
else if (command === 'info') {
  const uptime = process.uptime(); // seconden
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const embed = new EmbedBuilder()
    .setTitle('🤖 GridSplit Bot info')
    .setDescription('Here is some information about the bot.')
    .addFields(
      { name: 'Bot name, value: `${client.user.username}`, inline: true },
      { name: 'Made by', value: 'hallohallo0768', inline: true },
      { name: 'Servers active', value: `${client.guilds.cache.size}`, inline: true },
      { name: 'Users', value: `${client.users.cache.size}`, inline: true },
      { name: 'Prefix', value: '`!`', inline: true },
      { name: 'Version', value: '1.0.0', inline: true },
      { name: 'Node.js Version', value: `${process.version}`, inline: true },
      { name: 'Uptime after the newest update', value: `${hours}u ${minutes}m ${seconds}s`, inline: true }
    )
    .setThumbnail(client.user.displayAvatarURL())
    .setColor(0x7289da)
    .setFooter({ text: 'Thanks for using the bot!' })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}

  
    else if (command === 'help') {
      const embed = new EmbedBuilder()
        .setTitle('📖 Help Menu')
        .setDescription('Hier is een lijst met beschikbare commands:')
        .addFields(
          { name: '!ban @user [reason]', value: 'Ban a usr.' },
          { name: '!unban [gebruiker ID]', value: 'Unban a user.' },
          { name: '!kick @gebruiker [reden]', value: 'Kick a user.' },
          { name: '!warn @gebruiker [reden]', value: 'Warn a user.' },
          { name: '!mute @gebruiker [tijd]', value: 'Mute a user.' },
          { name: '!clear [aantal]', value: 'Delete messages.' },  
          { name: '!giveaway [tijd] [prijs]', value: 'Start a giveaway.' },
          { name: '!embed [tekst]', value: 'Send an embed with your text.' },
          { name: '!boosters', value: 'Shows all members that boosted.' },
          { name: '!level', value: 'Shows your level.' },
          { name: '!poll [vraag]', value: 'Start a poll.' },
          { name: '!suggestion [suggestie]', value: 'Send your suggestion.' },
          { name: '!ticket [reden]', value: 'Make a ticket.' },
          { name: '!add', value: 'Add a user to the ticket.' },
          { name: '!remove', value: 'Remove a user from the ticket.' },
          { name: '!close', value: 'Close the ticket.' },
          { name: '!info', value: 'Send information about the bot.' }
        )
        .setColor(0x00bfff)
        .setFooter({ text: 'Just JanCarlos Bot' })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    }

  } catch (err) {
    console.error(err);
    message.reply('An error occurred while executing the command.');
  }
});

async function logToChannel(guild, embed) {
  const logChannelName = 'logs'; // Pas aan naar je echte logkanaal
  const logChannel = guild.channels.cache.find(channel => channel.name === logChannelName && channel.isTextBased());

  if (!logChannel) {
    console.warn(`⚠️ Logchannel "${logChannelName}" not found in ${guild.name}.`);
    return;
  }

  try {
    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error(`❌ Error while logging in ${logChannelName}:`, err);
  }
}


async function handleViolation(type, trigger, message) {
  await message.delete().catch(() => {});
  
  // DM sturen
  try {
    await message.author.send(`⚠️ Your message in **${message.guild.name}** is deleted because of **${type}**.\n**Inhoud/Trigger:** ${trigger}`);
  } catch (err) {
    console.warn(`⚠️ can not send a DM to ${message.author.tag}: ${err.message}`);
  }

  // Publieke waarschuwing
  const warning = await message.channel.send({
    content: `${message.author}, your message is deleted because of  **${type}**.`,
    allowedMentions: { users: [message.author.id] }
  });
  setTimeout(() => warning.delete().catch(() => {}), 5000);

  // Log naar kanaal
  const embed = new EmbedBuilder()
    .setTitle('🚨 AutoMod interventions')
    .addFields(
      { name: 'User', value: message.author.tag, inline: true },
      { name: 'Type of violations', value: type, inline: true },
      { name: 'Trigger', value: trigger, inline: false },
      { name: 'Channel', value: `<#${message.channel.id}>`, inline: true }
    )
    .setColor(0xff0000)
    .setTimestamp();

  await logToChannel(message.guild, embed);
}


client.login(process.env.TOKEN);
