const moment = require('moment');
const config = require('../../config');

module.exports = {
  checkUnixTimestamp: async (currentUnixTimestamp, futureUnixTimestamp) => {
    if (currentUnixTimestamp > futureUnixTimestamp) {
      return true;
    } else {
      return false;
    }
  },
  getNextBump: async () => {
    var now = new Date();
    var nextBumpTimestamp = moment(now).add(
      config.bumpCooldown,
      config.bumpCooldownUnit
    );
    return moment(nextBumpTimestamp).format('x');
  },
};
