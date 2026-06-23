const { Op } = require('sequelize');

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof RegExp) && !(value instanceof Date);
}

function normalizeFieldName(model, field) {
  if (!model?.rawAttributes || model.rawAttributes[field]) return field;
  const camel = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  if (model.rawAttributes[camel]) return camel;
  const snake = field.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  if (model.rawAttributes[snake]) return snake;
  return field;
}

function regexToLike(value) {
  return `%${String(value.source || value).replace(/^\^|\$$/g, '')}%`;
}

function translateFieldCondition(model, key, value) {
  const field = normalizeFieldName(model, key);

  if (value instanceof RegExp) return { [field]: { [Op.iLike]: regexToLike(value) } };
  if (value instanceof Date) return { [field]: value };

  if (!isPlainObject(value)) {
    if (field === 'assignedEmployeeIds' && typeof value === 'number') return { [field]: { [Op.contains]: [value] } };
    return { [field]: value };
  }

  const operators = {};
  if (value.$in !== undefined) operators[Op.in] = Array.isArray(value.$in) && value.$in.length ? value.$in : [-1];
  if (value.$ne !== undefined) operators[Op.ne] = value.$ne;
  if (value.$gte !== undefined) operators[Op.gte] = value.$gte;
  if (value.$gt !== undefined) operators[Op.gt] = value.$gt;
  if (value.$lte !== undefined) operators[Op.lte] = value.$lte;
  if (value.$lt !== undefined) operators[Op.lt] = value.$lt;
  if (value.$like !== undefined) operators[Op.like] = value.$like;
  if (value.$iLike !== undefined) operators[Op.iLike] = value.$iLike;
  if (value.$contains !== undefined) operators[Op.contains] = value.$contains;

  return Object.keys(operators).length || Object.getOwnPropertySymbols(operators).length ? { [field]: operators } : { [field]: value };
}

function toSequelizeWhere(filter = {}, model = null) {
  if (!filter || typeof filter !== 'object') return {};
  if (Object.prototype.hasOwnProperty.call(filter, 'where')) return filter.where || {};
  const where = {};
  for (const [key, value] of Object.entries(filter)) {
    if (key === '$or') { where[Op.or] = (value || []).map((clause) => toSequelizeWhere(clause, model)); continue; }
    if (key === '$and') { where[Op.and] = (value || []).map((clause) => toSequelizeWhere(clause, model)); continue; }
    Object.assign(where, translateFieldCondition(model, key, value));
  }
  return where;
}

function toSequelizeOrder(sort = {}, model = null) {
  if (!sort) return undefined;
  if (Array.isArray(sort)) return sort;
  return Object.entries(sort).map(([field, direction]) => [
    normalizeFieldName(model, field),
    direction === -1 || String(direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC',
  ]);
}

function parseAttributes(select) {
  if (!select) return undefined;
  if (Array.isArray(select)) return select;
  if (typeof select === 'string') return select.split(/\s+/).filter(Boolean);
  if (typeof select === 'object') return Object.entries(select).filter(([, v]) => Boolean(v)).map(([k]) => k);
  return undefined;
}

function where(filter, model) { return toSequelizeWhere(filter, model); }
function inList(values) { return { $in: values }; }
function not(value) { return { $ne: value }; }
function gte(value) { return { $gte: value }; }
function gt(value) { return { $gt: value }; }
function lte(value) { return { $lte: value }; }
function lt(value) { return { $lt: value }; }
function iLike(value) { return { $iLike: value }; }
function contains(value) { return { $contains: value }; }
function orWhere(clauses) { return { $or: clauses }; }
function andWhere(clauses) { return { $and: clauses }; }

module.exports = {
  where,
  inList,
  not,
  gte,
  gt,
  lte,
  lt,
  iLike,
  contains,
  orWhere,
  andWhere,
  toSequelizeWhere,
  toSequelizeOrder,
  parseAttributes,
  normalizeFieldName,
};
