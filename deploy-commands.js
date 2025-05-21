const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Waarschuw een gebruiker')
    .addUserOption(option =>
      option.setName('gebruiker')
        .setDescription('De gebruiker die je wil waarschuwen')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reden')
        .setDescription('Reden voor waarschuwing')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick een gebruiker')
    .addUserOption(option =>
      option.setName('gebruiker')
        .setDescription('De gebruiker die je wil kicken')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reden')
        .setDescription('Reden voor kick')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban een gebruiker')
    .addUserOption(option =>
      option.setName('gebruiker')
        .setDescription('De gebruiker die je wil bannen')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reden')
        .setDescription('Reden voor ban')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban een gebruiker via ID')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('De ID van de gebruiker')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Verwijder berichten')
    .addIntegerOption(option =>
      option.setName('aantal')
        .setDescription('Aantal berichten om te verwijderen')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Stuur een embed bericht')
    .addStringOption(option =>
      option.setName('bericht')
        .setDescription('De tekst voor in de embed')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Toon hulp over de bot')
]
.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔁 Slash commands registreren...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Registratie gelukt!');
  } catch (error) {
    console.error('❌ Fout bij registratie:', error);
  }
})();
