const get = require("lodash.get");

const updateOneHOR = (
  updatorPath,
  inputPath,
  recordIdPath,
  notificationTopic
) => async (root, args, context) => {
  // get object from path
  const data = get(args, inputPath);
  // get creator from path
  const updator = get(context, updatorPath);
  // get recordId from path
  const recordId = get(args, recordIdPath);
  // createObject
  const record = await updator(recordId, data);
  // notifyPubsub
  await context.pubsub.publish(notificationTopic, record);
  // return object
  return record;
};

module.exports = updateOneHOR;
