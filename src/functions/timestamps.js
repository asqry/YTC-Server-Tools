const moment = require('moment');

module.exports = {
  checkUnixTimestamp: async (currentUnixTimestamp, futureUnixTimestamp) => {
    if (currentUnixTimestamp < futureUnixTimestamp) {
      return true;
    } else {
      return false;
    }
  },
  getNextBump: async () => {
    var now = new Date();
    var nextBumpTimestamp = moment(now).add(2, 'hours');
    return moment(nextBumpTimestamp).format('x');
  },
};
