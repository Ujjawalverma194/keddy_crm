const { Op } = require('sequelize');

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof RegExp) && !(v instanceof Date);
}

function translateCondition(key, value) {
  if (key === '$or') {
    return { [Op.or]: value.map((clause) => translateWhere(clause)) };
  }
  if (key === '$and') {
    return { [Op.and]: value.map((clause) => translateWhere(clause)) };
  }

  if (value instanceof RegExp) {
    const pattern = value.source.replace(/^\^|\$$/g, '');
    return { [key]: { [Op.iLike]: `%${pattern}%` } };
  }

  if (value instanceof Date) {
    return { [key]: value };
  }

  if (!isPlainObject(value)) {
    if (key === 'assignedEmployeeIds' && typeof value === 'number') {
      return { [key]: { [Op.contains]: [value] } };
    }
    return { [key]: value };
  }

  const ops = {};
  if (value.$in !== undefined) {
    ops[Op.in] = value.$in.length ? value.$in : [-1];
  }
  if (value.$ne !== undefined) ops[Op.ne] = value.$ne;
  if (value.$gte !== undefined) ops[Op.gte] = value.$gte;
  if (value.$gt !== undefined) ops[Op.gt] = value.$gt;
  if (value.$lte !== undefined) ops[Op.lte] = value.$lte;
  if (value.$lt !== undefined) ops[Op.lt] = value.$lt;

  const hasOps =
    Object.keys(ops).length > 0 || Object.getOwnPropertySymbols(ops).length > 0;
  if (hasOps) {
    return { [key]: ops };
  }

  return { [key]: value };
}

function translateWhere(filter = {}) {
  if (!filter || typeof filter !== 'object') return {};
  const where = {};

  for (const [key, value] of Object.entries(filter)) {
    if (key === '$or') {
      where[Op.or] = value.map((clause) => translateWhere(clause));
      continue;
    }
    if (key === '$and') {
      where[Op.and] = value.map((clause) => translateWhere(clause));
      continue;
    }
    Object.assign(where, translateCondition(key, value));
  }

  return where;
}

function translateSort(sort = {}) {
  return Object.entries(sort).map(([field, dir]) => [field, dir === -1 || dir === 'desc' ? 'DESC' : 'ASC']);
}

function parseSelect(select) {
  if (!select) return undefined;
  if (typeof select === 'string') {
    return select.split(/\s+/).filter(Boolean);
  }
  if (typeof select === 'object') {
    return Object.entries(select)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }
  return undefined;
}

module.exports = { translateWhere, translateSort, parseSelect };
