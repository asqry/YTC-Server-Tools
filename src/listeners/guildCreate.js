const { MessageEmbed, Message } = require('discord.js');
const message = require('./message');
const moment = require('moment');

const serverCheck = require('../functions/serverCheck');
const config = require('../../config');

module.exports = async (client, guild) => {
  let consentEmbed = new MessageEmbed()
    .setTitle('YTC Server Utilities')
    .setColor(0x385da1)
    .setDescription(
      `This bot was added to the server \`${guild.name}\`.\n\nIf you own this server and want to go further in the approval process, press \\✅. If not, press \\❌`
    )
    .setFooter(
      `This message is meant for ${guild.owner.user.tag}. If this is not you, please press ❌`
    )
    .setTimestamp();

  guild.owner
    .send(consentEmbed)
    .then((msg) => {
      msg
        .react('✅')
        .then(() => {
          msg.react('❌');
        })
        .then(() => {
          let collector = msg.createReactionCollector(
            (reaction, user) =>
              reaction.emoji.name === '✅' || ('❌' && !user.bot),
            { max: 2 }
          );
          collector.on('collect', async (reaction, user) => {
            if (reaction.emoji.name === '✅') {
              setTimeout(async () => {
                const result = await serverCheck(guild);
                let verdictEmbed = new MessageEmbed().setDescription(
                  `Safety Checks: ${
                    result.safety ? '✅' : '❌'
                  }\n\nGeneral Checks: ${
                    result.normal ? '✅' : '❌'
                  }\n\nAfter the above checks, your server has been ${
                    result.final
                      ? 'approved, and will be manually reviewed by a YTC Staff Member.'
                      : 'denied. Please make sure that your server...\n\n> Follows the Discord TOS\n> Is clean and safe for all users\n> Has moderation settings of `MEDIUM` or higher\n> Has less than 2 marked NSFW channels\n\nOnce these are met, you may re-apply by adding the bot back to your server: `' +
                        guild.name +
                        '`\n\nIf your server follows these rules and you see this message, please contact a YTC Staff Member.'
                  }`
                );

                reaction.message.channel.send(verdictEmbed).then(async () => {
                  if (result.final === false) guild.leave();
                  if (result.final === true) {
                    var region = '';
                    if (guild.region.toString().includes('us-')) {
                      region += '🇺🇸 ';
                    }
                    if (guild.region.toString().includes('eu')) {
                      region += '🇪🇺 ';
                    }
                    if (guild.region.toString().includes('sydney')) {
                      region += ':flag_au: ';
                    }
                    if (guild.region.toString().includes('hong')) {
                      region += ':flag_hk: ';
                    }
                    if (guild.region.toString().includes('southafrica')) {
                      region += ':flag_za: ';
                    }
                    if (guild.region.toString().includes('japan')) {
                      region += ':flag_jp: ';
                    }
                    if (guild.region.toString().includes('brazil')) {
                      region += ':flag_br: ';
                    }
                    if (guild.region.toString().includes('singapore')) {
                      region += ':flag_sg: ';
                    }
                    if (guild.region.toString().includes('russia')) {
                      region += ':flag_ru: ';
                    }

                    // guild.channels.cache
                    //   .first()

                    let invite = await guild.channels.cache
                      .filter((c) => c.type === 'text')
                      .first()
                      .createInvite({ maxAge: 0, reason: 'Server approved' });

                    let embed = new MessageEmbed()
                      .setTitle(guild.name + ' (click to join)')
                      .setURL(`https://discord.gg/${invite.code}`)
                      .setDescription(
                        `The server, \`${guild.name}\`, is awaiting approval!`
                      )
                      .setThumbnail(guild.iconURL)
                      .addField('Server Region', region, true)
                      .addField(
                        'Date Created',
                        `${moment(guild.createdAt).format(
                          'M/D/YYYY'
                        )} (${moment(guild.createdAt).fromNow()})`,
                        true
                      )
                      .addField(
                        'Member Count',
                        `${
                          guild.members.cache.filter((u) => !u.user.bot).size
                        } (\`Bots: ${
                          guild.members.cache.filter((u) => u.user.bot).size
                        }\`)`,
                        true
                      )
                      .addField(
                        `Automated Check Scores`,
                        `Safety Checks: **${result.safetyPoints}/4**\nGeneral Checks: **${result.normalPoints}/3**`
                      )
                      .setFooter(`✅ = Approve | ❌ = Deny`);

                    let approvalChannel = client.channels.cache.get(
                      config.staffChannel
                    );
                    approvalChannel.send(embed).then((m) => {
                      m.react('✅')
                        .then(() => {
                          m.react('❌');
                        })
                        .then(async () => {
                          const collector = await m.createReactionCollector(
                            (reaction, user) =>
                              reaction.emoji.name === '✅' ||
                              ('❌' && !user.bot),
                            { max: 2 }
                          );

                          collector.on('collect', (reaction, user) => {
                            if (reaction.emoji.name === '✅') {
                              let user = client.users.cache.get(guild.owner.id);
                              let approvalEmbed = new MessageEmbed()
                                .setTitle(
                                  `Your server: \`${guild.name}\` was approved`
                                )
                                .setDescription(
                                  `The bot will automatically create:\n\n> A private category called "YTC"\n> A private channel called "ytc-bump"\n> A private channel called "ytc-updates"\n\nThose channels will be important to your time using YTC Server Tools, please do not delete them.`
                                )
                                .setFooter(
                                  "You may change the channels' permissions to allow access to your staff team or other server members."
                                );

                              user.send(approvalEmbed).then(() => {
                                guild.channels
                                  .create('YTC', {
                                    type: 'category',
                                    permissionOverwrites: [
                                      {
                                        id: guild.id,
                                        deny: ['VIEW_CHANNEL'],
                                      },
                                    ],
                                  })
                                  .then((cat) => {
                                    guild.channels.create(`ytc-bump`, {
                                      type: 'text',
                                      parent: cat.id,
                                    });
                                    guild.channels.create(`ytc-updates`, {
                                      type: 'text',
                                      parent: cat.id,
                                    });
                                  });
                              });
                            } else {
                              let user = client.users.cache.get(guild.owner.id);
                              let denialEmbed = new MessageEmbed()
                                .setTitle(
                                  `Your server: \`${guild.name}\` was denied.`
                                )
                                .setDescription(
                                  `Please make sure that your server...\n\n> Follows the Discord TOS\n> Is clean and safe for all users\n> Has moderation settings of \`MEDIUM\` or higher\n> Has less than 2 marked NSFW channels\n\nIf you have any questions, please DM an Admin or higher on YTC.\n\nOnce these are met, you may re-apply by adding the bot back to your server: \`${guild.name}\``
                                );
                              user.send(denialEmbed);
                            }
                          });
                        });
                    });
                  }
                });
              }, 5000);
            } else {
              guild.leave();
              reaction.message.channel
                .send(
                  new MessageEmbed().setDescription(
                    `The operation was cancelled. Deleting the previous messages in ~10 seconds`
                  )
                )
                .then((m) => m.delete({ timeout: 10000 }));
              reaction.message.delete({ timeout: 10000 });
            }
            // reaction.message.channel.send('hi there ' + user.tag);
          });
        });
    })
    .catch((e) => {
      guild.channels.cache.array()[0].send(consentEmbed);
      console.error(e);
    });
};
