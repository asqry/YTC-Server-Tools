const moment = require('moment');
const fs = require('fs');
const badWords = require('../../badWords.js');

module.exports = async (guild) => {
  let features = guild.features;
  if (guild.partnered || guild.verified) return true;
  //SAFETY CHECK 🦺
  let safety = 0;
  let nsfwCount = 0;
  guild.channels.cache.forEach((channel) => {
    if (channel.nsfw) nsfwCount++;
  });

  if (nsfwCount <= 1) safety++;

  let creationDate = moment(guild.createdTimestamp).fromNow(true).split(' ');
  if (creationDate[1].toLowerCase().includes('month')) safety++;
  else if (creationDate[1].toLowerCase().includes('year')) safety++;
  else if (
    creationDate[1].toLowerCase().includes('day') &&
    parseInt(creationDate[0]) >= 2
  )
    safety++;

  const wordList = require('../../badWords.js');

  let acronym = guild.nameAcronym.toLowerCase();

  if (
    !wordList.match(new RegExp(acronym, 'gmi')) ||
    wordList.match(new RegExp(acronym, 'gmi')) === null
  )
    safety++;

  if (guild.iconURL && guild.iconURL !== null) safety++;

  //Non Important Stuff, needs 3/6 in order to pass
  let points = 0;

  if (guild.explicitContentFilter.toLowerCase() === 'all_members') points++;

  if (features.includes('COMMUNITY')) points++;

  const nameWords =
    'giveaway nitro trump biden nsfw 18+ politics democrat republican america';
  if (
    !nameWords.match(new RegExp(guild.name.toLowerCase(), 'gmi')) ||
    wordList.match(new RegExp(acronym, 'gmi')) === null
  )
    points++;

  //   if (guild.large) points++;
  let levels = ['MEDIUM', 'HIGH', 'VERY_HIGH'];
  if (levels.includes(guild.verificationLevel)) points++;

  if (
    guild.description &&
    !guild.description.match(
      new RegExp(wordList, 'gmi') &&
        !guild.description.match(new RegExp(nameWords, 'gmi'))
    )
  )
    points++;

  console.log('-----------------');
  console.log(safety, ' SAFETY');
  console.log(points, ' NORMAL');

  let final = {
    final: safety >= 3 && points >= 3 ? true : false,
    safety: safety >= 3,
    normal: points >= 3,
    safetyPoints: safety,
    normalPoints: points,
    verify: safety >= 3 && points >= 4 ? true : false,
  };

  return final;
};
