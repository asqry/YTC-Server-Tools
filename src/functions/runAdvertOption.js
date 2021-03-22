const { MessageEmbed } = require('discord.js');
const moment = require('moment');
let Guilds = require('../../models/Guild');
let config = require('../../config');
let { ytcBumpChannel, bumpCooldown } = require('../../config');
const verifyMsg = require('./verifyMsg');

let { checkUnixTimestamp, getNextBump } = require('.././functions/timestamps');
let verify = require('.././functions/verifyServer');

module.exports = async (client, channel, guild) => {
  let guildEntry = await Guilds.findOne({ id: guild.id });
  if (!guildEntry) return console.log('ERROR FINDING GUILD :(');
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
        `${user} -> What would you the new color of your ad to be? (HEX FORMAT https://www.google.com/search?q=color+picker) (Respond within 60 seconds)`
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
      // 🔼
      let bumpChannel = client.channels.cache.get(ytcBumpChannel);

      let guildEntry2 = await Guilds.findOne({ id: guild.id });
      if (!guildEntry2) return console.log('ERROR FINDING GUILD :(');

      let ad = new MessageEmbed()
        .setTitle(guild.name + ' <:YTCSTVerified:823402027253891083>')
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
          `Click [here](${guildEntry2.invite}) to join`
        )
        .setURL(guildEntry2.invite);

      //implement shit to stop them if they have already bumped

      console.log('DATE', Date.now());
      console.log('FUTURE', guildEntry2.nextBump);
      console.log('DATE < FUTURE', Date.now() < guildEntry2.nextBump);
      console.log(
        'FUNCTION',
        await checkUnixTimestamp(Date.now(), guildEntry2.nextBump)
      );

      if (guildEntry2.blacklisted === true) {
        reaction.message.channel
          .send(
            `${user} -> This guild (\`${guild.name}\`) is blacklisted from bumping. Please contact an admin with your support ID if you think this is a mistake.`
          )
          .then((msg) => msg.delete({ timeout: 5000 }));

        return;
      }

      if (!(await checkUnixTimestamp(Date.now(), guildEntry2.nextBump))) {
        reaction.message.channel
          .send(
            `${user} -> You already bumped within the last ${
              config.bumpCooldown
            } ${config.bumpCooldownUnit}. Please try again ${moment(
              guildEntry2.nextBump
            ).fromNow()}.`
          )
          .then((msg) => msg.delete({ timeout: 5000 }));
        return;
      } else {
        reaction.message.channel
          .send(
            `${user} -> Successfully bumped! You may bump again in ${config.bumpCooldown} ${config.bumpCooldownUnit}`
          )
          .then((msg) => msg.delete({ timeout: 5000 }));

        console.log('HI', await verify(guild));

        bumpChannel.send(ad);

        if (await verify(guild)) {
          let verifyConsent = new MessageEmbed()
            .setAuthor('Verification')
            .setColor('GREEN')
            .setDescription(
              `Your server is eligible for verification, would you like to apply?`
            );

          let verifyEmbed = await reaction.message.channel.send(verifyConsent);

          await verifyEmbed.react('✅');
          await verifyEmbed.react('❌');

          verifyMsg(verifyEmbed, guild);
        }
      }
      guildEntry2.nextBump = await getNextBump();
      guildEntry2.save();

      //implement shit to stop them if they have already bumped
    }
  });
};
