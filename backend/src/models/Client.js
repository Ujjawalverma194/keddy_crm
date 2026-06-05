const { wrapModel } = require('../utils/modelWrapper');
const { Client: ClientModel } = require('./sequelize/init');

module.exports = wrapModel(ClientModel);
