const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');

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
  if (message.author.bot) return;
  const prefix = '!';

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('Je hebt geen toestemming om leden te bannen.');
    }

    const member = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'Geen reden opgegeven';

    if (!member) return message.reply('Geef een geldige gebruiker op om te bannen.');

    await member.ban({ reason });
    message.channel.send(`${member.user.tag} is verbannen. ✅`);

    const logEmbed = new EmbedBuilder()
      .setTitle('Lid verbannen')
      .addFields(
        { name: 'Gebruiker', value: `${member.user.tag}`, inline: true },
        { name: 'Reden', value: reason, inline: true },
        { name: 'Moderator', value: `${message.author.tag}`, inline: true }
      )
      .setColor(0xff0000)
      .setTimestamp();

    await logToChannel(message.guild, logEmbed);
  }

  if (command === 'unban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('Je hebt geen toestemming om leden te unbannen.');
    }

    const userId = args[0];
    if (!userId) return message.reply('Geef het ID van de gebruiker op om te unbannen.');

    try {
      const user = await client.users.fetch(userId);
      await message.guild.members.unban(user);
      message.channel.send(`${user.tag} is unbanned. ✅`);

      const logEmbed = new EmbedBuilder()
        .setTitle('Lid geunbanned')
        .addFields(
          { name: 'Gebruiker ID', value: `${userId}`, inline: true },
          { name: 'Moderator', value: `${message.author.tag}`, inline: true }
        )
        .setColor(0x00ff00)
        .setTimestamp();

      await logToChannel(message.guild, logEmbed);
    } catch (error) {
      console.error(error);
      message.reply('Er is een fout opgetreden bij het unbannen.');
    }
  }

  if (command === 'clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply('Je hebt geen toestemming om berichten te verwijderen.');
    }

    const count = parseInt(args[0]);
    if (isNaN(count) || count <= 0 || count > 100) {
      return message.reply('Geef een geldig aantal berichten op tussen 1 en 100.');
    }

    await message.channel.bulkDelete(count, true);
    message.channel.send(`🧹 ${count} berichten zijn verwijderd.`).then(msg => setTimeout(() => msg.delete(), 3000));

    const logEmbed = new EmbedBuilder()
      .setTitle('Berichten verwijderd')
      .addFields(
        { name: 'Aantal', value: `${count}`, inline: true },
        { name: 'Uitgevoerd door', value: `${message.author.tag}`, inline: true }
      )
      .setColor(0xffa500)
      .setTimestamp();

    await logToChannel(message.guild, logEmbed);
  }

  if (command === 'embed') {
    const tekst = args.join(' ');
    if (!tekst) return message.reply('Voeg tekst toe aan het embed bericht.');

    const embed = new EmbedBuilder()
      .setDescription(tekst)
      .setColor(0xff5733)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    const logEmbed = new EmbedBuilder()
      .setTitle('Embed bericht aangemaakt')
      .addFields(
        { name: 'Aangemaakt door', value: `${message.author.tag}` }
      )
      .setColor(0xff0000)
      .setTimestamp();

    await logToChannel(message.guild, logEmbed);
  }

  if (command === 'poll') {
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
      .setTitle('Poll aangemaakt')
      .addFields(
        { name: 'Vraag', value: pollText },
        { name: 'Auteur', value: `${message.author.tag}`, inline: true }
      )
      .setColor(0x3498db)
      .setTimestamp();

    await logToChannel(message.guild, logEmbed);
  }

  if (command === 'ticket') {
    const reason = args.join(' ') || 'Geen reden opgegeven';

    const embed = new EmbedBuilder()
      .setTitle('🎫 Nieuw ticket aangemaakt')
      .addFields(
        { name: 'Gebruiker', value: `${message.author.tag}`, inline: true },
        { name: 'Reden', value: reason, inline: true }
      )
      .setColor(0x00ffff)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    await logToChannel(message.guild, embed);
  }
});

async function logToChannel(guild, embed) {
  const logChannel = guild.channels.cache.find(channel => channel.name === 'mod-logs');
  if (logChannel) {
    await logChannel.send({ embeds: [embed] });
  }
}

client.login('YOUR_BOT_TOKEN_HERE'); // Vergeet niet je echte bot-token hier te zetten!

