client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, member, guild, channel } = interaction;

  if (commandName === 'warn') {
    const user = options.getMember('gebruiker');
    const reason = options.getString('reden') || 'Geen reden opgegeven';
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages))
      return interaction.reply({ content: 'Geen toestemming.', ephemeral: true });

    interaction.reply(`${user} is gewaarschuwd. Reden: ${reason}`);
  }

  else if (commandName === 'kick') {
    const user = options.getMember('gebruiker');
    const reason = options.getString('reden') || 'Geen reden opgegeven';
    if (!user.kickable) return interaction.reply('Kan deze gebruiker niet kicken.');

    await user.kick(reason);
    interaction.reply(`${user.user.tag} is gekickt. Reden: ${reason}`);
  }

  else if (commandName === 'ban') {
    const user = options.getMember('gebruiker');
    const reason = options.getString('reden') || 'Geen reden opgegeven';
    if (!user.bannable) return interaction.reply('Kan deze gebruiker niet bannen.');

    await user.ban({ reason });
    interaction.reply(`${user.user.tag} is verbannen. Reden: ${reason}`);
  }

  else if (commandName === 'unban') {
    const userId = options.getString('userid');
    try {
      const bans = await guild.bans.fetch();
      const bannedUser = bans.get(userId);
      if (!bannedUser) return interaction.reply('Deze gebruiker is niet geband.');
      await guild.members.unban(userId);
      interaction.reply(`Gebruiker met ID ${userId} is unbanned.`);
    } catch (err) {
      console.error(err);
      interaction.reply('Fout bij unban.');
    }
  }

  else if (commandName === 'clear') {
    const amount = options.getInteger('aantal');
    if (amount < 1 || amount > 100) return interaction.reply('Aantal moet tussen 1 en 100 zijn.');
    await channel.bulkDelete(amount, true);
    interaction.reply(`${amount} berichten verwijderd.`);
  }

  else if (commandName === 'bans') {
    const bans = await guild.bans.fetch();
    if (bans.size === 0) return interaction.reply('Geen gebande gebruikers.');
    const list = bans.map(ban => `${ban.user.tag} (ID: ${ban.user.id})`).join('\n');
    interaction.reply(list.length > 2000 ? 'Te veel om te tonen.' : list);
  }

  else if (commandName === 'embed') {
    const bericht = options.getString('bericht');
    const embed = new EmbedBuilder()
      .setDescription(bericht)
      .setColor(0xff5733); // voorbeeld rood-oranje
    interaction.reply({ embeds: [embed] });
  }

  else if (commandName === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('📜 Hulp - Slash Commands')
      .addFields(
        { name: '/warn', value: 'Waarschuw een gebruiker.' },
        { name: '/kick', value: 'Kick een gebruiker.' },
        { name: '/ban', value: 'Ban een gebruiker.' },
        { name: '/unban', value: 'Unban een gebruiker via ID.' },
        { name: '/clear', value: 'Verwijder berichten (1-100).' },
        { name: '/bans', value: 'Toon gebande gebruikers.' },
        { name: '/embed', value: 'Maak een embed van jouw tekst.' },
        { name: '/help', value: 'Toon deze lijst.' }
      )
      .setColor(0xff5733)
      .setTimestamp();
    interaction.reply({ embeds: [embed], ephemeral: true });
  }
});
