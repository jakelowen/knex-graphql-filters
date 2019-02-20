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
          // is =
          case "is": {
            if (or) {
              query.orWhere(key, opValue);
            } else {
              query.where(key, opValue);
            }
            break;
          }
          // not <>
          case "not": {
            if (or) {
              query.orWhereNot(key, opValue);
            } else {
              query.whereNot(key, opValue);
            }
            break;
          }
          // in
          case "in": {
            if (or) {
              query.orWhereIn(key, opValue);
            } else {
              query.whereIn(key, opValue);
            }
            break;
          }
          // not in
          case "not_in": {
            if (or) {
              query.orWhereNotIn(key, opValue);
            } else {
              query.whereNotIn(key, opValue);
            }
            break;
          }
          // les than <
          case "lt": {
            if (or) {
              query.orWhere(key, "<", opValue);
            } else {
              query.where(key, "<", opValue);
            }
            break;
          }
          // less than or equal to <=
          case "lte": {
            if (or) {
              query.orWhere(key, "<=", opValue);
            } else {
              query.where(key, "<=", opValue);
            }
            break;
          }
          // greater than >
          case "gt": {
            if (or) {
              query.orWhere(key, ">", opValue);
            } else {
              query.where(key, ">", opValue);
            }
            break;
          }
          // greater than or equal to >=
          case "gte": {
            if (or) {
              query.orWhere(key, ">=", opValue);
            } else {
              query.where(key, ">=", opValue);
            }
            break;
          }
          // string value contains substring
          case "contains": {
            if (or) {
              query.orWhere(key, "ILIKE", `%${opValue}%`);
            } else {
              query.where(key, "ILIKE", `%${opValue}%`);
            }
            break;
          }
          // string value NOT contains substring
          case "not_contains": {
            if (or) {
              query.orWhere(key, "NOT ILIKE", `%${opValue}%`);
            } else {
              query.where(key, "NOT ILIKE", `%${opValue}%`);
            }
            break;
          }
          // string value begins with substring
          case "starts_with": {
            if (or) {
              query.orWhere(key, "ILIKE", `${opValue}%`);
            } else {
              query.where(key, "ILIKE", `${opValue}%`);
            }
            break;
          }
          // string value NOT begins with substring
          case "not_starts_with": {
            if (or) {
              query.orWhere(key, "NOT ILIKE", `${opValue}%`);
            } else {
              query.where(key, "NOT ILIKE", `${opValue}%`);
            }
            break;
          }
          // string value ends with substring
          case "ends_with": {
            if (or) {
              query.orWhere(key, "ILIKE", `%${opValue}`);
            } else {
              query.where(key, "ILIKE", `%${opValue}`);
            }
            break;
          }
          // string value NOT ends with substring
          case "not_ends_with": {
            if (or) {
              query.orWhere(key, "NOT ILIKE", `%${opValue}`);
            } else {
              query.where(key, "NOT ILIKE", `%${opValue}`);
            }
            break;
          }
          // DATERANGE  contains the value date - @>
          case "containsDate": {
            if (or) {
              query.orWhere(key, "@>", `[${opValue},${opValue}]`);
            } else {
              query.where(key, "@>", `[${opValue},${opValue}]`);
            }
            break;
          }
          // DATERANGE intersects with value range - &&
          case "overlapsDateRange": {
            if (or) {
              query.orWhere(
                key,
                "&&",
                `[${opValue.startDate},${opValue.endDate}]`
              );
            } else {
              query.where(
                key,
                "&&",
                `[${opValue.startDate},${opValue.endDate}]`
              );
            }
            break;
          }
          // DATERANGE encompasses date value range
          case "containsDateRange": {
            if (or) {
              query.orWhere(
                key,
                "@>",
                `[${opValue.startDate},${opValue.endDate}]`
              );
            } else {
              query.where(
                key,
                "@>",
                `[${opValue.startDate},${opValue.endDate}]`
              );
            }
            break;
          }
          // Between start and end value
          case "between": {
            if (or) {
              query.orWhereBetween(key, [opValue.start, opValue.end]);
            } else {
              query.whereBetween(key, [opValue.start, opValue.end]);
            }
            break;
          }
          // NOT Between start and end value
          case "not_between": {
            if (or) {
              query.orWhereNotBetween(key, [opValue.start, opValue.end]);
            } else {
              query.whereNotBetween(key, [opValue.start, opValue.end]);
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
