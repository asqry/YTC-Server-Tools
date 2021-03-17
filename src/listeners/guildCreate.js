const { MessageEmbed, Message } = require('discord.js');
const message = require('./message');
const moment = require('moment');
require('mongoose');

const serverCheck = require('../functions/serverCheck');
const config = require('../../config');

const Guilds = require('../../models/Guild');
const runAdvertOption = require('../functions/runAdvertOption');

module.exports = async (client, guild) => {
  // if (guildEntry.blacklisted === true) {
  //   guild.owner
  //     .send(
  //       `${user} -> \`${guild.name}\` is blacklisted. Please contact an admin with your server ID if you think this is a mistake.`
  //     )
  //     .then((msg) => msg.delete({ timeout: 5000 }));

  //   guild.leave();
  //   return;
  // }

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
                      ? 'approved, and will now be sent to manual review by a YTC Staff Member.'
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
                      .addField('Owner', `${guild.owner}`)
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
                              ('❌' && !user.bot)
                          );

                          collector.on('collect', (reaction, user) => {
                            let member = reaction.message.guild.members.cache.get(
                              user.id
                            );

                            if (!member.roles.cache.has(config.approval)) {
                              reaction.message.reactions
                                .resolve(reaction.emoji.name)
                                .users.remove(user.id);

                              user.send(
                                `${user} ->` +
                                  ' You are not a member of the approval team. Contact Asqry if this is a mistake.'
                              );

                              return;
                            }

                            collector.stop();

                            let reactedBy = user.tag;

                            if (reaction.emoji.name === '✅') {
                              reaction.message.reactions.removeAll();
                              m.embeds[0].setDescription(
                                `The server \`${guild.name}\` has been approved by ${reactedBy}!`
                              );
                              m.embeds[0].setColor(`#57f542`);
                              m.edit(m.embeds[0]);
                              let user = client.users.cache.get(guild.owner.id);
                              let approvalEmbed = new MessageEmbed()
                                .setTitle(
                                  `Your server: \`${guild.name}\` was approved!`
                                )
                                .setDescription(
                                  `The bot will automatically create:\n\n> A private category called "YTC"\n> A private channel called "ytc-tools"\n> A private channel called "ytc-updates"\n\nThose channels will be important to your time using YTC Server Tools, please do not delete them.`
                                )
                                .setFooter(
                                  "You may change the channels' permissions to allow access to your staff team or other server members. ANYONE WITH ACCESS TO THESE CHANNELS WILL BE ABLE TO CHANGE YOUR SETTINGS."
                                );

                              user.send(approvalEmbed).then(async () => {
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
                                  .then(async (cat) => {
                                    guild.channels
                                      .create(`ytc-tools`, {
                                        type: 'text',
                                        parent: cat.id,
                                      })
                                      .then(async (bumpChannel) => {
                                        guild.channels
                                          .create(`ytc-updates`, {
                                            type: 'text',
                                            parent: cat.id,
                                          })
                                          .then(async (updatesChannel) => {
                                            //This is where the stuff for entering them in the database should go :)

                                            let msg = `${guild.owner} -> Welcome to the {channel} channel! This channel will be used {desc}`;

                                            bumpChannel.send(
                                              `${msg
                                                .replace(
                                                  '{channel}',
                                                  `${bumpChannel}`
                                                )
                                                .replace(
                                                  '{desc}',
                                                  `as a hub for all YTC Server Tools commands!`
                                                )}`
                                            );
                                            updatesChannel.send(
                                              `${msg
                                                .replace(
                                                  '{channel}',
                                                  `${updatesChannel}`
                                                )
                                                .replace(
                                                  '{desc}',
                                                  `to notify you of new updates to the YTC server tools!`
                                                )}`
                                            );

                                            let findGuild = await Guilds.findOne(
                                              {
                                                id: guild.id,
                                              }
                                            );

                                            if (!findGuild) {
                                              // code for if the guild doesn't exist <<>> put 'er in there!
                                              let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                                                /[xy]/g,
                                                function (c) {
                                                  var r =
                                                      (Math.random() * 16) | 0,
                                                    v =
                                                      c == 'x'
                                                        ? r
                                                        : (r & 0x3) | 0x8;
                                                  return v.toString(16);
                                                }
                                              );
                                              const newGuild = new Guilds({
                                                uuid: uuid.toString(),
                                                id: guild.id,
                                                bumpChannel: bumpChannel.id,
                                                ownerId: guild.owner.id,
                                                updatesChannel:
                                                  updatesChannel.id,
                                                color: '#5486e4',
                                                nextBump: 0,
                                                optionsMessage: null,
                                                description: `We don't know much about ${guild.name}, but we're sure they're great.`,
                                                bumps: 0,
                                                invite: null,
                                                blacklisted: false,
                                              });

                                              newGuild.save().then((d) => {
                                                runAdvertOption(
                                                  client,
                                                  bumpChannel,
                                                  guild
                                                );
                                                guild.owner
                                                  .send(
                                                    `Your support ID for \`${guild.name}\` is: ||\`${d.uuid}\`|| \| Write this down.`
                                                  )
                                                  .then(() => {
                                                    console.log(
                                                      `New UUID notification successful!`
                                                    );
                                                  })
                                                  .catch((e) => {
                                                    guild.channels.cache
                                                      .array()[0]
                                                      .send(
                                                        `Your support ID for \`${guild.name}\` is: ||\`${d.uuid}\`|| \| Write this down.`
                                                      );
                                                  });
                                              });
                                            } else {
                                              cat.children.forEach((c) =>
                                                c.delete()
                                              );
                                              cat.delete();
                                              guild.owner
                                                .send(
                                                  `Your guild \`${guild.name}\` was already in our system, contact an Admin if this is a mistake.`
                                                )
                                                .then(() => {})
                                                .catch((e) => {
                                                  guild.channels.cache
                                                    .array()[0]
                                                    .send(
                                                      `Your guild \`${guild.name}\` was already in our system, contact an Admin if this is a mistake.`
                                                    );
                                                  console.error(e);
                                                });
                                            }
                                          });
                                      });
                                  });
                              });
                            } else {
                              let user = client.users.cache.get(guild.owner.id);
                              let denialEmbed = new MessageEmbed()
                                .setTitle(
                                  `Your server: \`${guild.name}\` was denied by ${reactedBy}.`
                                )
                                .setDescription(
                                  `Please make sure that your server...\n\n> Follows the Discord TOS\n> Is clean and safe for all users\n> Has moderation settings of \`MEDIUM\` or higher\n> Has less than 2 marked NSFW channels\n\nIf you have any questions, please DM an Admin or higher on YTC.\n\nOnce these are met, you may re-apply by adding the bot back to your server: \`${guild.name}\``
                                );
                              user.send(denialEmbed);
                              guild.leave();
                            }
                          });
                        });
                    });
                  }
                });
              }, 1000);
            } else {
              reaction.message.reactions.removeAll();
              m.embeds[0].setDescription(
                `The server \`${guild.name}\` has been denied by ${reactedBy}.`
              );
              m.embeds[0].setColor(`#f54242`);
              m.edit(m.embeds[0]);
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
            // reaction.message.channel.send('hi there ' + reactedBy);
          });
        });
    })
    .catch((e) => {
      guild.channels.cache.array()[0].send(consentEmbed);
      console.error(e);
    });
};
