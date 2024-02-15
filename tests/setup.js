require('dotenv').config();
const sequelize = require('../src/config/sequelize');


beforeAll(async () => {
  await sequelize.sync({ force: true }); // Warning: This will clear the database
});

afterAll(async () => {
  await sequelize.close();
});
