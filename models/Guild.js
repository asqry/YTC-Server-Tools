const { Schema, model } = require('mongoose');

const data = new Schema({
  uuid: String,
  id: String,
  bumpChannel: String,
  ownerId: String,
  updatesChannel: String,
  ytcCategory: String,
  nextBump: Number,
  optionsMessage: String,
  description: String,
  bumps: Number,
  color: String,
  invite: String,
  blacklisted: Boolean,
});

module.exports = new model('guild', data);
