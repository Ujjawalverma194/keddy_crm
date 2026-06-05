const bcrypt = require('bcryptjs');
const { wrapModel } = require('../utils/modelWrapper');
const { User: UserModel } = require('./sequelize/init');

const User = wrapModel(UserModel, {
  async hashPassword(plain) {
    return bcrypt.hash(plain, 10);
  },
});

module.exports = User;
