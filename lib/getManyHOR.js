const map = require("lodash.map");
const applyFilters = require("./applyFilters");

const getManyHOR = (tableName, existsFilters) => async (
  root,
  args,
  context
) => {
  let query = context.knex(tableName);
  if (args.input && args.input.where) {
    if (existsFilters) {
      map(existsFilters, (value, key) => {
        if (key in args.input.where) {
          delete args.input.where[key];
          query = query.whereExists(function() {
            applyFilters(
              this.select(1)
                .from(value.tableName)
                .whereRaw(value.where)
                .limit(1),
              args.input.where[key]
            );
          });
        }
      });
    }

    query = applyFilters(query, args.input.where);
  }

  const countQuery = query.clone();
  const selectQuery = query.clone();
  const [count] = await countQuery.count("*");

  if (args.input && args.input.sort) {
    selectQuery.orderBy(
      map(args.input.sort, (order, column) => ({
        column,
        order
      }))
    );
  }

  const limit = args.input && args.input.limit ? args.input.limit : 20;
  const offset = args.input && args.input.offset ? args.input.offset : 0;

  selectQuery.limit(limit + 1);
  selectQuery.offset(offset);

  const items = await selectQuery.select("*");

  return {
    hasMore: items.length === limit + 1,
    totalCount: count.count,
    items: items.slice(0, limit)
  };
};

module.exports = getManyHOR;
