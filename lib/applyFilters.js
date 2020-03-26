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

function wrap(query, opts) {
  if (opts && opts.having) {
    const unsupported = () => {
      throw Error('This type of filtering is unsupported');
    };
    return {
      and: (...args) => query.andHaving(...args),
      orRaw: (...args) => query.orHavingRaw(...args),
      raw: (...args) => query.havingRaw(...args),
      or: (...args) => query.orHaving(...args),
      filter: (...args) => query.having(...args),
      orNot: unsupported,
      not: unsupported,
      orIn: (...args) => query.orHavingIn(...args),
      in: (...args) => query.havingIn(...args),
      orNotIn: (...args) => query.orHavingNotIn(...args),
      notIn: (...args) => query.havingNotIn(...args),
      orBetween: (...args) => query.orHavingBetween(...args),
      between: (...args) => query.havingBetween(...args),
      orNotBetween: (...args) => query.orHavingNotBetween(...args),
      notBetween: (...args) => query.havingNotBetween(...args),
      orNotNull: (...args) => query.orHavingNotNull(...args),
      notNull: (...args) => query.havingNotNull(...args),
    };
  }
  return {
    and: (...args) => query.andWhere(...args),
    orRaw: (...args) => query.orWhereRaw(...args),
    raw: (...args) => query.whereRaw(...args),
    or: (...args) => query.orWhere(...args),
    filter: (...args) => query.where(...args),
    orNot: (...args) => query.orWhereNot(...args),
    not: (...args) => query.whereNot(...args),
    orIn: (...args) => query.orWhereIn(...args),
    in: (...args) => query.whereIn(...args),
    orNotIn: (...args) => query.orWhereNotIn(...args),
    notIn: (...args) => query.whereNotIn(...args),
    orBetween: (...args) => query.orWhereBetween(...args),
    between: (...args) => query.whereBetween(...args),
    orNotBetween: (...args) => query.orWhereNotBetween(...args),
    notBetween: (...args) => query.whereNotBetween(...args),
    orNotNull: (...args) => query.orWhereNotNull(...args),
    notNull: (...args) => query.whereNotNull(...args),
  };
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

  // This wrapper is so we can keep similar querying code for both where and having.
  const filterApplier = wrap(query, opts);
  map(filters, (value, key) => {
    // and
    const keyIsOr = key === 'OR';
    if (keyIsOr || key === 'AND') {
      const nextLevelOr = key === 'OR';
      // Change the where depending on what the previous level said.
      if (or) {
        // eslint-disable-next-line func-names
        filterApplier.or(function() {
          value.forEach(x => {
            applyFilters(this, x, opts, nextLevelOr);
          });
        });
      } else {
        // eslint-disable-next-line func-names
        filterApplier.and(function() {
          value.forEach(x => {
            applyFilters(this, x, opts, nextLevelOr);
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
                filterApplier.orRaw(`${keyName} = ${opValue}`);
              } else {
                filterApplier.raw(`${keyName} = ${opValue}`);
              }
            } else if (or) {
              filterApplier.or(key, opValue);
            } else {
              filterApplier.filter(key, opValue);
            }
            break;
          }
          // not <>
          case 'not': {
            if (shouldRenderAsLong(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                filterApplier.orRaw(`${keyName} <> ${opValue}`);
              } else {
                filterApplier.raw(`${keyName} <> ${opValue}`);
              }
            } else if (or) {
              filterApplier.orNot(key, opValue);
            } else {
              filterApplier.not(key, opValue);
            }
            break;
          }
          // in
          case 'in': {
            if (shouldRenderAsLongList(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                filterApplier.orRaw(`${keyName} IN ${renderLongList(opValue)}`);
              } else {
                filterApplier.raw(`${keyName} IN ${renderLongList(opValue)}`);
              }
            } else if (or) {
              filterApplier.orIn(key, opValue);
            } else {
              filterApplier.in(key, opValue);
            }
            break;
          }
          // not in
          case 'not_in': {
            if (shouldRenderAsLongList(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                filterApplier.orRaw(
                  `"${keyName}" NOT IN ${renderLongList(opValue)}`
                );
              } else {
                filterApplier.raw(
                  `"${keyName}" NOT IN ${renderLongList(opValue)}`
                );
              }
            } else if (or) {
              filterApplier.orNotIn(key, opValue);
            } else {
              filterApplier.notIn(key, opValue);
            }
            break;
          }
          // les than <
          case 'lt': {
            if (shouldRenderAsLong(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                filterApplier.orRaw(`${keyName} < ${opValue}`);
              } else {
                filterApplier.raw(`${keyName} < ${opValue}`);
              }
            } else if (or) {
              filterApplier.or(key, '<', opValue);
            } else {
              filterApplier.filter(key, '<', opValue);
            }
            break;
          }
          // less than or equal to <=
          case 'lte': {
            if (shouldRenderAsLong(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                filterApplier.orRaw(`${keyName} <= ${opValue}`);
              } else {
                filterApplier.raw(`${keyName} <= ${opValue}`);
              }
            } else if (or) {
              filterApplier.or(key, '<=', opValue);
            } else {
              filterApplier.filter(key, '<=', opValue);
            }
            break;
          }
          // greater than >
          case 'gt': {
            if (shouldRenderAsLong(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                filterApplier.orRaw(`${keyName} > ${opValue}`);
              } else {
                filterApplier.raw(`${keyName} > ${opValue}`);
              }
            } else if (or) {
              filterApplier.or(key, '>', opValue);
            } else {
              filterApplier.filter(key, '>', opValue);
            }
            break;
          }
          // greater than or equal to >=
          case 'gte': {
            if (shouldRenderAsLong(opts, key, opValue)) {
              const keyName = getKeyName(opts, key);
              if (or) {
                filterApplier.orRaw(`${keyName} >= ${opValue}`);
              } else {
                filterApplier.raw(`${keyName} >= ${opValue}`);
              }
            } else if (or) {
              filterApplier.or(key, '>=', opValue);
            } else {
              filterApplier.filter(key, '>=', opValue);
            }
            break;
          }
          // string value contains substring
          case 'contains': {
            if (or) {
              filterApplier.or(key, 'LIKE', `%${opValue}%`);
            } else {
              filterApplier.filter(key, 'LIKE', `%${opValue}%`);
            }
            break;
          }
          // string value NOT contains substring
          case 'not_contains': {
            if (or) {
              filterApplier.or(key, 'NOT LIKE', `%${opValue}%`);
            } else {
              filterApplier.filter(key, 'NOT LIKE', `%${opValue}%`);
            }
            break;
          }
          // string value begins with substring
          case 'starts_with': {
            if (or) {
              filterApplier.or(key, 'LIKE', `${opValue}%`);
            } else {
              filterApplier.filter(key, 'LIKE', `${opValue}%`);
            }
            break;
          }
          // string value NOT begins with substring
          case 'not_starts_with': {
            if (or) {
              filterApplier.or(key, 'NOT LIKE', `${opValue}%`);
            } else {
              filterApplier.filter(key, 'NOT LIKE', `${opValue}%`);
            }
            break;
          }
          // string value ends with substring
          case 'ends_with': {
            if (or) {
              filterApplier.or(key, 'LIKE', `%${opValue}`);
            } else {
              filterApplier.filter(key, 'LIKE', `%${opValue}`);
            }
            break;
          }
          // string value NOT ends with substring
          case 'not_ends_with': {
            if (or) {
              filterApplier.or(key, 'NOT LIKE', `%${opValue}`);
            } else {
              filterApplier.filter(key, 'NOT LIKE', `%${opValue}`);
            }
            break;
          }
          // DATERANGE  contains the value date - @>
          case 'containsDate': {
            if (or) {
              filterApplier.or(key, '@>', `[${opValue},${opValue}]`);
            } else {
              filterApplier.filter(key, '@>', `[${opValue},${opValue}]`);
            }
            break;
          }
          // DATERANGE intersects with value range - &&
          case 'overlapsDateRange': {
            if (or) {
              filterApplier.or(
                key,
                '&&',
                `[${opValue.startDate},${opValue.endDate}]`
              );
            } else {
              filterApplier.filter(
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
              filterApplier.or(
                key,
                '@>',
                `[${opValue.startDate},${opValue.endDate}]`
              );
            } else {
              filterApplier.filter(
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
              filterApplier.orBetween(key, [opValue.start, opValue.end]);
            } else {
              filterApplier.between(key, [opValue.start, opValue.end]);
            }
            break;
          }
          // NOT Between start and end value
          case 'not_between': {
            if (or) {
              filterApplier.orNotBetween(key, [opValue.start, opValue.end]);
            } else {
              filterApplier.notBetween(key, [opValue.start, opValue.end]);
            }
            break;
          }
          // NOT Between start and end value
          case 'not_null': {
            if (or) {
              filterApplier.orNotNull(key);
            } else {
              filterApplier.notNull(key);
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
  // console.log(query.toString());
  return query;
};

module.exports = applyFilters;
