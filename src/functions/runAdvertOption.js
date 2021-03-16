const { MessageEmbed } = require('discord.js');
const moment = require('moment');
let { ytcBumpChannel } = require('../../config');

let { checkUnixTimestamp, getNextBump } = require('.././functions/timestamps');

module.exports = async (client, channel, guild, guildEntry) => {
  let invite = await guild.channels.cache
    .filter((c) => c.type === 'text')
    .first()
    .createInvite({ maxAge: 0, reason: 'Server approved' });

  guildEntry.invite = 'https://discord.gg/' + invite.code;
  guildEntry.save();

  let options = [
    {
      emoji: '📖',
      description: 'Set your server description',
    },
    {
      emoji: '🔼',
      description: 'Bump your server',
    },
    {
      emoji: '🎨',
      description: "Set your server's display color",
    },
    {
      emoji: 'ℹ',
      description: "See your server's ad",
    },
  ];
  let optionsEmbed = new MessageEmbed()
    .setColor('PINK')
    .setTitle(`Advertisement options for \`${guild.name}\``)
    .setFooter(`Support ID: ${guildEntry.uuid}`);

  options.forEach((option) => {
    optionsEmbed.addField(option.emoji, option.description, true);
  });

  let m = await channel.send(optionsEmbed);

  guildEntry.optionsMessage = m.id;
  guildEntry.save();

  let validEmoteList = options.map((x) => x.emoji);

  validEmoteList.forEach((emote) => {
    m.react(emote);
  });

  let collector = m.createReactionCollector(
    async (reaction, user) =>
      !user.bot && validEmoteList.join('').includes(reaction.emoji.name)
  );

  collector.on('collect', async (reaction, user) => {
    reaction.message.reactions
      .resolve(reaction.emoji.name)
      .users.remove(user.id);
    if (reaction.emoji.name === validEmoteList[0]) {
      // 📖

      let msg = await reaction.message.channel.send(
        `${user} -> What would you like your new description to be? (Respond within 60 seconds)`
      );
      msg.channel
        .awaitMessages(
          (inpM) => inpM.author.id === user.id && !inpM.author.bot,
          { max: 1, time: 60000, errors: ['time'] }
        )
        .then((collected) => {
          msg.delete({ timeout: 5000 });
          let content = collected.first().content;

          collected.first().delete();

          if (content.length > 500) {
            msg.channel
              .send(
                `${user} -> Your new description must be smaller than 500 characters, yours was **${content.length}/500**. Nothing was changed.`
              )
              .then((msg) => msg.delete({ timeout: 5000 }));

            return;
          } else {
            msg.channel
              .send(
                `${user} -> Your new description has been set to \`\`\`${content}\`\`\``
              )
              .then((msg) => msg.delete({ timeout: 5000 }));
          }

          guildEntry.description = content;
          guildEntry.save();
        })
        .catch((collected) => {
          msg.delete();
          reaction.message.channel
            .send(`${user} -> You ran out of time.`)
            .then((msg) => {
              msg.delete({ timeout: 5000 });
            });
        });
    } else if (reaction.emoji.name === validEmoteList[3]) {
      // ℹ
      let ad = new MessageEmbed()
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL())
        .setDescription(guildEntry.description)
        .setColor(
          guildEntry.color.match(/\b[0-9A-F]{6}\b/gi)
            ? guildEntry.color
            : '#5486e4'
        )
        .addField(`Owner`, `${guild.owner}`, true)
        .addField(
          'Member Count',
          `\`Humans: ${
            guild.members.cache.filter((u) => !u.user.bot).size
          }\` | \`Bots: ${
            guild.members.cache.filter((u) => u.user.bot).size
          }\``,
          true
        )
        .addField(
          'Date Created',
          `${moment(guild.createdAt).format('M/D/YYYY')} (${moment(
            guild.createdAt
          ).fromNow()})`,
          true
        )
        .addField(
          `Join "${guild.name}"`,
          `Click [here](${guildEntry.invite}) to join`
        )
        .setURL(guildEntry.invite);

      reaction.message.channel
        .send(ad)
        .then((msg) => msg.delete({ timeout: 15000 }));
    } else if (reaction.emoji.name === validEmoteList[2]) {
      // 🎨
      let msg = await reaction.message.channel.send(
        `${user} -> What would you the new color of your ad to be? (HEX FORMAT) (Respond within 60 seconds)`
      );
      msg.channel
        .awaitMessages(
          (inpM) => inpM.author.id === user.id && !inpM.author.bot,
          {
            max: 1,
            time: 60000,
            errors: ['time'],
          }
        )
        .then((collected) => {
          msg.delete({ timeout: 5000 });
          let content = collected.first().content;

          collected.first().delete();

          if (!content.match(/\b[0-9A-F]{6}\b/gi)) {
            msg.channel
              .send(
                `${user} -> Your new color has been set to \`${content}\`.\n\nHowever, your message was not in valid (or expected: **#XXXXXX**) HEX format, so the color might not show up as expected. (Hex: **#XXXXXX**)`
              )
              .then((msg) => msg.delete({ timeout: 10000 }));
          } else {
            msg.channel
              .send(
                `${user} -> Your new color has been set to \`\`\`${content}\`\`\``
              )
              .then((msg) => msg.delete({ timeout: 5000 }));
          }

          guildEntry.color = content;
          guildEntry.save();
        })
        .catch((collected) => {
          msg.delete();
          reaction.message.channel
            .send(`${user} -> You ran out of time.`)
            .then((msg) => {
              msg.delete({ timeout: 5000 });
            });
        });
    } else if (reaction.emoji.name === validEmoteList[1]) {
      let bumpChannel = client.channels.cache.get(ytcBumpChannel);

      let ad = new MessageEmbed()
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL())
        .setDescription(guildEntry.description)
        .setColor(
          guildEntry.color.match(/\b[0-9A-F]{6}\b/gi)
            ? guildEntry.color
            : '#5486e4'
        )
        .addField(`Owner`, `${guild.owner}`, true)
        .addField(
          'Member Count',
          `\`Humans: ${
            guild.members.cache.filter((u) => !u.user.bot).size
          }\` | \`Bots: ${
            guild.members.cache.filter((u) => u.user.bot).size
          }\``,
          true
        )
        .addField(
          'Date Created',
          `${moment(guild.createdAt).format('M/D/YYYY')} (${moment(
            guild.createdAt
          ).fromNow()})`,
          true
        )
        .addField(
          `Join "${guild.name}"`,
          `Click [here](${guildEntry.invite}) to join`
        )
        .setURL(guildEntry.invite);

      //implement shit to stop them if they have already bumped

      console.log('DATE', moment(new Date()).format('x'));
      console.log('FUTURE', guildEntry.nextBump);
      console.log(
        'DATE < FUTURE',
        moment(new Date()).format('x') < guildEntry.nextBump
      );
      console.log(
        'FUNCTION',
        await checkUnixTimestamp(
          moment(new Date()).format('x'),
          guildEntry.nextBump
        )
      );

      if (
        !(await checkUnixTimestamp(
          moment(new Date()).format('x'),
          guildEntry.nextBump
        ))
      ) {
        reaction.message.channel
          .send(
            `${user} -> You already bumped within the last 2 hours. Please try again later`
          )
          .then((msg) => msg.delete({ timeout: 5000 }));
      } else {
        bumpChannel.send(ad);
      }

      guildEntry.nextBump = await getNextBump();
      guildEntry.save();

      //implement shit to stop them if they have already bumped
    }
  });
};
