const get = require("lodash.get");

const getOneHOR = (loaderPath, recordIdPath) => async (root, args, ctx) => {
  const loader = get(ctx, loaderPath);
  const id = get(args, recordIdPath);
  return loader.load(id);
};

module.exports = getOneHOR;
