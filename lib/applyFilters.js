const map = require("lodash.map");

const applyFilters = (query, where, or) => {
  if (!where) {
    return query;
  }

  map(where, (value, key) => {
    // and
    if (key === "AND") {
      // eslint-disable-next-line func-names
      query.andWhere(function() {
        value.forEach(x => {
          applyFilters(this, x);
        });
      });
    }
    // or
    else if (key === "OR") {
      // eslint-disable-next-line func-names
      query.orWhere(function() {
        value.forEach(x => {
          applyFilters(this, x, true);
        });
      });
    } else {
      map(value, (opValue, op) => {
        switch (op) {
          case "is": {
            if (or) {
              query.orWhere(key, opValue);
            } else {
              query.where(key, opValue);
            }
            break;
          }
          case "not": {
            if (or) {
              query.orWhereNot(key, opValue);
            } else {
              query.whereNot(key, opValue);
            }
            break;
          }
          case "in": {
            if (or) {
              query.orWhereIn(key, opValue);
            } else {
              query.whereIn(key, opValue);
            }
            break;
          }
          case "not_in": {
            if (or) {
              query.orWhereNotIn(key, opValue);
            } else {
              query.whereNotIn(key, opValue);
            }
            break;
          }
          case "lt": {
            if (or) {
              query.orWhere(key, "<", opValue);
            } else {
              query.where(key, "<", opValue);
            }
            break;
          }
          case "lte": {
            if (or) {
              query.orWhere(key, "<=", opValue);
            } else {
              query.where(key, "<=", opValue);
            }
            break;
          }
          case "gt": {
            if (or) {
              query.orWhere(key, ">", opValue);
            } else {
              query.where(key, ">", opValue);
            }
            break;
          }
          case "gte": {
            if (or) {
              query.orWhere(key, ">=", opValue);
            } else {
              query.where(key, ">=", opValue);
            }
            break;
          }
          case "contains": {
            if (or) {
              query.orWhere(key, "ILIKE", `%${opValue}%`);
            } else {
              query.where(key, "ILIKE", `%${opValue}%`);
            }
            break;
          }
          case "not_contains": {
            if (or) {
              query.orWhere(key, "NOT ILIKE", `%${opValue}%`);
            } else {
              query.where(key, "NOT ILIKE", `%${opValue}%`);
            }
            break;
          }
          case "starts_with": {
            if (or) {
              query.orWhere(key, "ILIKE", `${opValue}%`);
            } else {
              query.where(key, "ILIKE", `${opValue}%`);
            }
            break;
          }
          case "not_starts_with": {
            if (or) {
              query.orWhere(key, "NOT ILIKE", `${opValue}%`);
            } else {
              query.where(key, "NOT ILIKE", `${opValue}%`);
            }
            break;
          }
          case "ends_with": {
            if (or) {
              query.orWhere(key, "ILIKE", `%${opValue}`);
            } else {
              query.where(key, "ILIKE", `%${opValue}`);
            }
            break;
          }
          case "not_ends_with": {
            if (or) {
              query.orWhere(key, "NOT ILIKE", `%${opValue}`);
            } else {
              query.where(key, "NOT ILIKE", `%${opValue}`);
            }
            break;
          }
          case "containsDate": {
            if (or) {
              query.orWhere(key, "@>", `[${opValue},${opValue}]`);
            } else {
              query.where(key, "@>", `[${opValue},${opValue}]`);
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
  console.log(query.toString());
  return query;
};

module.exports = applyFilters;
