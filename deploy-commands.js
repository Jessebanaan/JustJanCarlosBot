require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('hello').setDescription('Zeg hallo!'),
  new SlashCommandBuilder().setName('warn').setDescription('Waarschuw een gebruiker')
    .addUserOption(option => option.setName('gebruiker').setDescription('Wie wil je waarschuwen?').setRequired(true)),
  new SlashCommandBuilder().setName('kick').setDescription('Kick een gebruiker')
    .addUserOption(option => option.setName('gebruiker').setDescription('Wie wil je kicken?').setRequired(true)),
  new SlashCommandBuilder().setName('ban').setDescription('Ban een gebruiker')
    .addUserOption(option => option.setName('gebruiker').setDescription('Wie wil je bannen?').setRequired(true)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Slash commands registreren...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('Slash commands succesvol geregistreerd!');
  } catch (error) {
    console.error(error);
  }
})();
