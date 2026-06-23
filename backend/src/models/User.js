const bcrypt = require('bcryptjs');
const { createSequelizeRepository } = require('../utils/sequelizeRepository');
const { User: UserModel } = require('./sequelize/init');

const User = createSequelizeRepository(UserModel, {
  async hashPassword(plain) {
    return bcrypt.hash(plain, 10);
  },
});

module.exports = User;
