const mongoose = require('mongoose');
require('dotenv').config();

module.exports = {
  connect: async () => {
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
    });

    console.log('Initializing database connection...');

    mongoose.connection.once('open', () => {
      console.log('Connected to the database.');
    });
  },
};
