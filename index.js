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

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

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


    else if (command === 'help') {
      const embed = new EmbedBuilder()
        .setTitle('📖 Help Menu')
        .setDescription('Hier is een lijst met beschikbare commands:')
        .addFields(
          { name: '!ban @gebruiker [reden]', value: 'Verban een gebruiker.' },
          { name: '!unban [gebruiker ID]', value: 'Unban een gebruiker.' },
          { name: '!kick @gebruiker [reden]', value: 'Kick een gebruiker.' },
          { name: '!warn @gebruiker [reden]', value: 'Waarschuw een gebruiker.' },
          { name: '!clear [aantal]', value: 'Verwijder berichten.' },
          { name: '!embed [tekst]', value: 'Stuur een embed met jouw tekst.' },
          { name: '!poll [vraag]', value: 'Start een poll.' },
          { name: '!ticket [reden]', value: 'Maak een ticket aan.' }
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
  const logChannel = guild.channels.cache.find(c => c.name === 'mod-logs' && c.isTextBased?.());
  if (logChannel) {
    await logChannel.send({ embeds: [embed] });
  }
}

client.login(process.env.TOKEN);
