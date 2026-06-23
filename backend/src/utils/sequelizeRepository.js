const bcrypt = require('bcryptjs');
const { toSequelizeWhere, toSequelizeOrder, parseAttributes } = require('./sequelizeWhere');

function hydrate(model, row) {
  if (!row) return null;
  const instance = row.get ? row : model.build(row, { isNewRecord: false });
  if (model.name === 'User' && typeof instance.comparePassword !== 'function') {
    instance.comparePassword = async function comparePassword(candidate) {
      return bcrypt.compare(candidate, this.password);
    };
  }
  return instance;
}

class SequelizeRepositoryQuery {
  constructor(model, filter = {}) {
    this.model = model;
    this.filter = filter || {};
    this.options = {};
  }
  orderBy(sort) { this.options.order = toSequelizeOrder(sort, this.model); return this; }
  sort(sort) { return this.orderBy(sort); }
  offset(value) { this.options.offset = Number(value) || 0; return this; }
  skip(value) { return this.offset(value); }
  limit(value) { this.options.limit = Number(value) || undefined; return this; }
  select(value) { this.options.attributes = parseAttributes(value); return this; }
  async exec() { return this.all(); }
  async all() {
    const rows = await this.model.findAll({ where: toSequelizeWhere(this.filter, this.model), ...this.options });
    return rows.map((row) => hydrate(this.model, row));
  }
  then(resolve, reject) { return this.all().then(resolve, reject); }
  catch(reject) { return this.all().catch(reject); }
}

function looksLikeSequelizeOptions(value = {}) {
  return ['where', 'include', 'attributes', 'order', 'transaction', 'raw', 'limit', 'offset'].some((k) => Object.prototype.hasOwnProperty.call(value || {}, k));
}

function createSequelizeRepository(model, extras = {}) {
  const repository = {
    model,
    rawModel: model,

    query(filter = {}) { return new SequelizeRepositoryQuery(model, filter); },
    findByWhere(filter = {}) { return new SequelizeRepositoryQuery(model, filter); },
    find(filter = {}) { return new SequelizeRepositoryQuery(model, filter); },

    async findOneByWhere(filter = {}, options = {}) {
      const row = await model.findOne({ where: toSequelizeWhere(filter, model), ...options });
      return hydrate(model, row);
    },

    async findOne(filterOrOptions = {}) {
      const row = looksLikeSequelizeOptions(filterOrOptions)
        ? await model.findOne(filterOrOptions)
        : await model.findOne({ where: toSequelizeWhere(filterOrOptions, model) });
      return hydrate(model, row);
    },

    async findById(id) { return hydrate(model, await model.findByPk(id)); },
    async findByPk(id, options) { return hydrate(model, await model.findByPk(id, options)); },

    async countByWhere(filter = {}) { return model.count({ where: toSequelizeWhere(filter, model) }); },
    async countDocuments(filter = {}) { return repository.countByWhere(filter); },

    async updateOneByWhere(filter = {}, update = {}, options = {}) {
      let row = await model.findOne({ where: toSequelizeWhere(filter, model), transaction: options.transaction });
      if (!row && options.upsert) row = await model.create({ ...filter, ...update }, { transaction: options.transaction });
      else if (row) await row.update(update, { transaction: options.transaction });
      if (!row) return null;
      return options.returnOriginal ? hydrate(model, row) : repository.findOneByWhere(filter, { transaction: options.transaction });
    },

    async updateOne(filter = {}, update = {}, options = {}) {
      const [affected] = await model.update(update, { where: toSequelizeWhere(filter, model), limit: 1, transaction: options.transaction });
      return { acknowledged: true, matchedCount: affected, modifiedCount: affected };
    },

    async findOneAndUpdate(filter = {}, update = {}, options = {}) {
      return repository.updateOneByWhere(filter, update, { ...options, returnOriginal: options.new === false });
    },

    async deleteOneByWhere(filter = {}, options = {}) {
      const deleted = await model.destroy({ where: toSequelizeWhere(filter, model), limit: 1, transaction: options.transaction });
      return { acknowledged: true, deletedCount: deleted };
    },

    async deleteOne(filter = {}, options = {}) { return repository.deleteOneByWhere(filter, options); },

    ...extras,
  };

  return new Proxy(repository, {
    get(target, prop) {
      if (prop in target) return target[prop];
      const value = model[prop];
      return typeof value === 'function' ? value.bind(model) : value;
    },
    set(target, prop, value) {
      if (prop in target) target[prop] = value;
      else model[prop] = value;
      return true;
    },
  });
}

module.exports = { createSequelizeRepository, SequelizeRepositoryQuery };
