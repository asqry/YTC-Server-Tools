const { ytcID } = require('../../config');
const Guilds = require('../../models/Guild');

module.exports = async (client, message) => {
  let args = message.content.slice('ytc!'.length).trim().split(/ +/g);
  let command = args.shift().toLowerCase();

  if (command === 'blacklist') {
    if (
      !message.member.permissions.has(['MANAGE_GUILD', 'ADMINISTRATOR']) ||
      message.guild.id !== ytcID
    )
      return message.delete();

    let guildID = args[0];
    let guild = await Guilds.findOne({ id: guildID });
    if (!guild) {
      message.delete();
      message.channel.send(
        `${message.member} -> That guild is not in our system`
      );
    } else {
      message.delete;
      guild.blacklisted = true;
      guild.save().then((d) => {
        message.channel
          .send(
            `${message.member} -> Guild \`${d.id}\` has been blacklisted successfully`
          )
          .then((m) => m.delete({ timeout: 5000 }));
      });
    }
  } else if (command === 'safeleave') {
    let guildEntry = await Guilds.findOne({ id: message.guild.id });
    if (!guildEntry) return;

    if (message.author.id !== message.guild.owner.id) return;

    let cat = message.guild.channels.cache.get(guildEntry.bumpChannel).parent;

    console.log(guildEntry);
    cat.children.forEach((c) => {
      c.delete();
    });
    cat.delete();

    if (guildEntry.blacklisted === true) {
      guildEntry.optionsMessage = null;
      guildEntry.bumpChannel = null;
      guildEntry.updatesChannel = null;
      guildEntry.save().then(() => {
        return message.guild.leave();
      });
    } else {
      guildEntry.remove().then(() => {
        message.guild.leave();
      });
    }
  }
};
