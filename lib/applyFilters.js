const map = require('lodash.map');

// applyFilters supports a way of rendering long filters as actual longs.
// Presto does not support strings->long conversion.
function isTextNumber(value) {
  return /^\d+$/.test(value);
}

function isTextLongList(value) {
  return value.reduce(
    (accumulator, currentValue) => accumulator && isTextNumber(currentValue),
    true
  );
}

function shouldRenderAsLong(opts, key, value) {
  return (
    opts &&
    opts.fields &&
    opts.fields[key] &&
    opts.fields[key].renderAsLongs &&
    isTextNumber(value)
  );
}

function shouldRenderAsLongList(opts, key, value) {
  return (
    opts &&
    opts.fields &&
    opts.fields[key] &&
    opts.fields[key].renderAsLongs &&
    isTextLongList(value)
  );
}

function renderLongList(value) {
  return `(${value.join(', ')})`;
}

function getKeyName(opts, key) {
  if (opts) {
    if (opts.fields) {
      const fieldOpts = opts.fields[key];
      if (fieldOpts && fieldOpts.name) {
        return fieldOpts.name;
      }
    }
    if (opts.columnFormatter) {
      return `"${opts.columnFormatter(key)}"`;
    }
  }
  return key;
}

// TODO - if the top level is an OR, it'll wrap the whole condition in parentheses.  We can change this later.

// opts is a mapping to customize renders.
// opts currently has two fields: columnFormatter and fields.
// fields contains a mapping of field names to options.  The only supported
// field options right now are renderAsLong.
const applyFilters = (query, filters, opts, or) => {
  if (!filters) {
    return query;
  }

  // If we have a having clause with an OR or AND, knex is partially broken.
  // We want to what the having but then use 'where' inside it.  I don't know
  // the library does this.
  if (opts && opts.having) {
    query = query.having(function(query) {
      const newOpts = {...opts}
      newOpts.having = false;
      internalApplyFilters(query, filters, newOpts, or);
    });
  } else {
    internalApplyFilters(query, filters, opts, or);
  }
  return query;
}

const internalApplyFilters = (query, filters, opts, or) => {
  if (!filters) {
    return query;
  }

  map(filters, (value, key) => {
    // and
    const keyIsOr = key === 'OR';
    if (keyIsOr || key === 'AND') {
      const nextLevelOr = key === 'OR';
      // Change the where depending on what the previous level said.
      if (or) {
        // eslint-disable-next-line func-names
        query.orWhere(function(subquery) {
          value.forEach(x => {
            internalApplyFilters(subquery, x, opts, nextLevelOr);
          });
        });
      } else {
        // eslint-disable-next-line func-names
        query.andWhere(function(subquery) {
          value.forEach(x => {
            internalApplyFilters(subquery, x, opts, nextLevelOr);
          });
        });
      }
    } else {
      map(value, (opValue, op) => {
        switch (op) {
          // is =
          case 'is': {
            if (shouldRenderAsLong(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                query.orWhereRaw(`${keyName} = ${opValue}`);
              } else {
                query.whereRaw(`${keyName} = ${opValue}`);
              }
            } else if (or) {
              query.orWhere(key, opValue);
            } else {
              query.where(key, opValue);
            }
            break;
          }
          // not <>
          case 'not': {
            if (shouldRenderAsLong(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                query.orWhereRaw(`${keyName} <> ${opValue}`);
              } else {
                query.whereRaw(`${keyName} <> ${opValue}`);
              }
            } else if (or) {
              query.orWhereNot(key, opValue);
            } else {
              query.whereNot(key, opValue);
            }
            break;
          }
          // in
          case 'in': {
            if (shouldRenderAsLongList(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                query.orWhereRaw(`${keyName} IN ${renderLongList(opValue)}`);
              } else {
                query.whereRaw(`${keyName} IN ${renderLongList(opValue)}`);
              }
            } else if (or) {
              query.orWhereIn(key, opValue);
            } else {
              query.whereIn(key, opValue);
            }
            break;
          }
          // not in
          case 'not_in': {
            if (shouldRenderAsLongList(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                query.orWhereRaw(
                  `"${keyName}" NOT IN ${renderLongList(opValue)}`
                );
              } else {
                query.whereRaw(
                  `"${keyName}" NOT IN ${renderLongList(opValue)}`
                );
              }
            } else if (or) {
              query.orWhereNotIn(key, opValue);
            } else {
              query.whereNotIn(key, opValue);
            }
            break;
          }
          // les than <
          case 'lt': {
            if (shouldRenderAsLong(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                query.orWhereRaw(`${keyName} < ${opValue}`);
              } else {
                query.whereRaw(`${keyName} < ${opValue}`);
              }
            } else if (or) {
              query.orWhere(key, '<', opValue);
            } else {
              query.where(key, '<', opValue);
            }
            break;
          }
          // less than or equal to <=
          case 'lte': {
            if (shouldRenderAsLong(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                query.orWhereRaw(`${keyName} <= ${opValue}`);
              } else {
                query.whereRaw(`${keyName} <= ${opValue}`);
              }
            } else if (or) {
              query.orWhere(key, '<=', opValue);
            } else {
              query.where(key, '<=', opValue);
            }
            break;
          }
          // greater than >
          case 'gt': {
            if (shouldRenderAsLong(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                query.orWhereRaw(`${keyName} > ${opValue}`);
              } else {
                query.where(`${keyName} > ${opValue}`);
              }
            } else if (or) {
              query.orWhere(key, '>', opValue);
            } else {
              query.where(key, '>', opValue);
            }
            break;
          }
          // greater than or equal to >=
          case 'gte': {
            if (shouldRenderAsLong(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                query.orWhereRaw(`${keyName} >= ${opValue}`);
              } else {
                query.whereRaw(`${keyName} >= ${opValue}`);
              }
            } else if (or) {
              query.orWhere(key, '>=', opValue);
            } else {
              query.where(key, '>=', opValue);
            }
            break;
          }
          // string value contains substring
          case 'contains': {
            if (or) {
              query.orWhere(key, 'LIKE', `%${opValue}%`);
            } else {
              query.where(key, 'LIKE', `%${opValue}%`);
            }
            break;
          }
          // string value NOT contains substring
          case 'not_contains': {
            if (or) {
              query.orWhere(key, 'NOT LIKE', `%${opValue}%`);
            } else {
              query.where(key, 'NOT LIKE', `%${opValue}%`);
            }
            break;
          }
          // string value begins with substring
          case 'starts_with': {
            if (or) {
              query.orWhere(key, 'LIKE', `${opValue}%`);
            } else {
              query.where(key, 'LIKE', `${opValue}%`);
            }
            break;
          }
          // string value NOT begins with substring
          case 'not_starts_with': {
            if (or) {
              query.orWhere(key, 'NOT LIKE', `${opValue}%`);
            } else {
              query.where(key, 'NOT LIKE', `${opValue}%`);
            }
            break;
          }
          // string value ends with substring
          case 'ends_with': {
            if (or) {
              query.orWhere(key, 'LIKE', `%${opValue}`);
            } else {
              query.where(key, 'LIKE', `%${opValue}`);
            }
            break;
          }
          // string value NOT ends with substring
          case 'not_ends_with': {
            if (or) {
              query.orWhere(key, 'NOT LIKE', `%${opValue}`);
            } else {
              query.where(key, 'NOT LIKE', `%${opValue}`);
            }
            break;
          }
          // DATERANGE  contains the value date - @>
          case 'containsDate': {
            if (or) {
              query.orWhere(key, '@>', `[${opValue},${opValue}]`);
            } else {
              query.where(key, '@>', `[${opValue},${opValue}]`);
            }
            break;
          }
          // DATERANGE intersects with value range - &&
          case 'overlapsDateRange': {
            if (or) {
              query.orWhere(
                key,
                '&&',
                `[${opValue.startDate},${opValue.endDate}]`
              );
            } else {
              query.where(
                key,
                '&&',
                `[${opValue.startDate},${opValue.endDate}]`
              );
            }
            break;
          }
          // DATERANGE encompasses date value range
          case 'containsDateRange': {
            if (or) {
              query.orWhere(
                key,
                '@>',
                `[${opValue.startDate},${opValue.endDate}]`
              );
            } else {
              query.where(
                key,
                '@>',
                `[${opValue.startDate},${opValue.endDate}]`
              );
            }
            break;
          }
          // Between start and end value
          case 'between': {
            if (or) {
              query.orWhereBetween(key, [opValue.start, opValue.end]);
            } else {
              query.whereBetween(key, [opValue.start, opValue.end]);
            }
            break;
          }
          // NOT Between start and end value
          case 'not_between': {
            if (or) {
              query.orWhereNotBetween(key, [opValue.start, opValue.end]);
            } else {
              query.notWhereBetween(key, [opValue.start, opValue.end]);
            }
            break;
          }
          // NOT Between start and end value
          case 'not_null': {
            if (or) {
              query.orWhereNotNull(key);
            } else {
              query.whereNotNull(key);
            }
            break;
          }
          default: {
            break;
          }

        }
      });
    }
  });
  return query;
};

module.exports = applyFilters;
