const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const { Client: ClientModel } = require('./sequelize/init');

module.exports = createSequelizeRepository(ClientModel);
