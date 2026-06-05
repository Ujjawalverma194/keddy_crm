const { translateWhere, translateSort, parseSelect } = require('./mongoQuery');

class ModelInstance {
  constructor(sequelizeModel, data, isNew = false) {
    this._model = sequelizeModel;
    this._isNew = isNew;
    Object.assign(this, data);

    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop.startsWith('_')) {
            return target[prop];
          }
          if (prop in target) {
            return target[prop];
          }
          // camelCase to snake_case
          const snake = prop.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
          if (snake in target) {
            return target[snake];
          }
          // snake_case to camelCase
          const camel = prop.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          if (camel in target) {
            return target[camel];
          }
        }
        return target[prop];
      },

      set(target, prop, value) {
        if (typeof prop === 'string') {
          target[prop] = value;
          const snake = prop.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
          if (snake !== prop) {
            target[snake] = value;
          }
          const camel = prop.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
          if (camel !== prop) {
            target[camel] = value;
          }
          return true;
        }
        target[prop] = value;
        return true;
      },
    });
  }

  async save() {
    const data = this.toJSON();
    if (this._isNew || !data.id) {
      const row = await this._model.create(data);
      Object.assign(this, row.get({ plain: true }));
      this._isNew = false;
      return this;
    }
    const { id, ...updates } = data;
    await this._model.update(updates, { where: { id } });
    const refreshed = await this._model.findOne({ where: { id }, raw: true });
    if (refreshed) Object.assign(this, refreshed);
    return this;
  }

  toJSON() {
    const plain = {};
    const attrs = this._model.rawAttributes;
    if (attrs) {
      for (const key of Object.keys(attrs)) {
        const val = this[key];
        if (val !== undefined) plain[key] = val;
      }
    } else {
      for (const key of Object.keys(this)) {
        if (!key.startsWith('_')) plain[key] = this[key];
      }
    }
    return plain;
  }

  async comparePassword(candidate) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(candidate, this.password);
  }
}

class QueryChain {
  constructor(sequelizeModel, filter = {}) {
    this._model = sequelizeModel;
    this._filter = filter;
    this._sort = null;
    this._skip = null;
    this._limit = null;
    this._attributes = null;
  }

  sort(sortObj) {
    this._sort = sortObj;
    return this;
  }

  skip(n) {
    this._skip = n;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  select(fields) {
    this._attributes = parseSelect(fields);
    return this;
  }

  async exec() {
    const options = {
      where: translateWhere(this._filter),
      order: this._sort ? translateSort(this._sort) : undefined,
      offset: this._skip ?? undefined,
      limit: this._limit ?? undefined,
      attributes: this._attributes,
      raw: true,
    };
    const rows = await this._model.findAll(options);
    return rows.map((r) => new ModelInstance(this._model, r));
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

function wrapModel(sequelizeModel, statics = {}) {
  const api = {
    find(filter = {}) {
      return new QueryChain(sequelizeModel, filter);
    },

    async findOne(filter = {}) {
      const row = await sequelizeModel.findOne({
        where: translateWhere(filter),
        raw: true,
      });
      return row ? new ModelInstance(sequelizeModel, row) : null;
    },

    async create(data) {
      const row = await sequelizeModel.create(data);
      return new ModelInstance(sequelizeModel, row.get({ plain: true }));
    },

    build(data = {}) {
      return new ModelInstance(sequelizeModel, { ...data }, true);
    },

    async countDocuments(filter = {}) {
      return sequelizeModel.count({ where: translateWhere(filter) });
    },

    async updateOne(filter, update) {
      const [count] = await sequelizeModel.update(update, {
        where: translateWhere(filter),
      });
      return { modifiedCount: count };
    },

    async deleteOne(filter) {
      const count = await sequelizeModel.destroy({ where: translateWhere(filter) });
      return { deletedCount: count };
    },

    async findOneAndUpdate(filter, update, options = {}) {
      const where = translateWhere(filter);
      let row = await sequelizeModel.findOne({ where, raw: true });
      if (!row && options.upsert) {
        const created = await sequelizeModel.create({ ...filter, ...update });
        return new ModelInstance(sequelizeModel, created.get({ plain: true }));
      }
      if (row) {
        await sequelizeModel.update(update, { where: { id: row.id } });
        row = await sequelizeModel.findOne({ where: { id: row.id }, raw: true });
      }
      return row ? new ModelInstance(sequelizeModel, row) : null;
    },
  };

  return Object.assign(api, statics);
}

module.exports = { wrapModel, ModelInstance };
