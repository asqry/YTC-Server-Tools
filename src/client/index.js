/*
© Asqry 2021. Made for YTC @ https://discord.gg/KNWD636aDD
*/

//Modules
const { Client } = require('discord.js');
require('dotenv/config');

//Global Vars
var client = new Client({ partials: ['REACTION', 'MESSAGE'] });

//Imports
const {
  message: msg,
  messageReactionAdd,
  guildMemberAdd,
  guildCreate,
} = require('../listeners');
const { connect: mongoConnect } = require('../functions/mongoConnect');
const runAdvertOption = require('../functions/runAdvertOption');
const Guilds = require('../../models/Guild');

//Events
client.on('ready', () => {
  client.user.setActivity('Invite me to advertise your server on YTC!', {
    type: 'WATCHING',
  });
  mongoConnect();

  client.guilds.cache.forEach(async (guild) => {
    let g = await Guilds.findOne({ id: guild.id });
    if (!g) return;
    let bumpChannel = guild.channels.cache.get(g.bumpChannel);
    let m = await bumpChannel.messages.fetch(g.optionsMessage);
    if (!m || m == null || m == undefined)
      runAdvertOption(client, bumpChannel, guild, g);
    else {
      m.delete();
      runAdvertOption(client, bumpChannel, guild, g);
    }
  });

  console.log(`Ready at`, client.user.tag);
});

client.on('message', async (message) => {
  if (message.author.bot || !message.guild) return;
  if (message.content === '>test') {
    client.emit('guildCreate', message.guild);
  }
  msg(client, message);
});

client.on('messageReactionAdd', async (reaction, user) => {
  let msg = await reaction.message.fetch(reaction.message.id);
  messageReactionAdd(reaction, user, msg);
});

client.on('guildMemberAdd', async (member) => {
  guildMemberAdd(client, member);
});

client.on('guildCreate', async (guild) => {
  guildCreate(client, guild);
});

//Connect to Discord
client.login(client.token);
