const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Waarschuw een gebruiker.')
    .addUserOption(option =>
      option.setName('gebruiker').setDescription('Gebruiker om te waarschuwen').setRequired(true))
    .addStringOption(option =>
      option.setName('reden').setDescription('Reden van waarschuwing')),
  
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick een gebruiker.')
    .addUserOption(option =>
      option.setName('gebruiker').setDescription('Gebruiker om te kicken').setRequired(true))
    .addStringOption(option =>
      option.setName('reden').setDescription('Reden van kick'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban een gebruiker.')
    .addUserOption(option =>
      option.setName('gebruiker').setDescription('Gebruiker om te bannen').setRequired(true))
    .addStringOption(option =>
      option.setName('reden').setDescription('Reden van ban'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban een gebruiker met ID.')
    .addStringOption(option =>
      option.setName('userid').setDescription('ID van de gebruiker').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Verwijder een aantal berichten.')
    .addIntegerOption(option =>
      option.setName('aantal').setDescription('Aantal berichten (1-100)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('bans')
    .setDescription('Toon de lijst met gebande gebruikers.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Stuur een embed met jouw bericht.')
    .addStringOption(option =>
      option.setName('bericht').setDescription('Wat moet erin staan?').setRequired(true)),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Toon de help met alle commando\'s.')
]
.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
  .then(() => console.log('✅ Slash commands geregistreerd!'))
  .catch(console.error);
