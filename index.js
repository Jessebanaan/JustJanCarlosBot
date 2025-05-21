const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField } = require('discord.js');

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
  }

  if (command === 'embed') {
    const tekst = args.join(' ');
    if (!tekst) return message.reply('Voeg tekst toe aan het embed bericht.');

    const embed = new EmbedBuilder()
      .setDescription(tekst)
      .setColor(0xff5733)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
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
  }
});

client.login(process.env.TOKEN);
