async function getNextSequence(name) {
  const { Counter } = require('../models/sequelize/init');
  const [counter] = await Counter.findOrCreate({
    where: { name },
    defaults: { seq: 0 },
  });
  counter.seq += 1;
  await counter.save();
  return counter.seq;
}

module.exports = { getNextSequence };
