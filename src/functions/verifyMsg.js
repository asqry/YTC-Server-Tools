const Discord = require('discord.js');

module.exports = async (message, guild) => {
  let verifyEmotes = ['✅', '❌'];

  let verifyCol = message.createReactionCollector(
    async (reaction, user) =>
      !user.bot && verifyEmotes.join('').includes(reaction.emoji.name)
  );

  verifyCol.on('collect', async (reaction, user) => {
    message.reactions.resolve(reaction.emoji.name).users.remove(user.id);
    if (reaction.emoji.name === '✅') {
      let embed = new Discord.MessageEmbed().setColor('GREEN');

      embed.setDescription(
        'Alright, your server will be sent to manual approval by a YTC staff member, if approved you will receive the following perks:\n> 1,000 Character description limit\n> Shorter bump cooldown time (1 hour)\n> The "Verified Server Owner" role on the YTC Discord server\n> A fancy checkmark next to your server\'s name in your bump ad'
      );
    } else if (reaction.emoji.name === '❌') {
      console.log('they said no, big sad :(');
    } else return;
  });
};
