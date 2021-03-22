let serverCheck = require('./serverCheck');

module.exports = async (guild) => {
  let res = await serverCheck(guild);
  if (res.verify === true) return true;
  return false;
};
