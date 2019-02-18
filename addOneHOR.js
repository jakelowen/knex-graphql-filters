const get = require("lodash.get");

const addOneHOR = (creatorPath, inputPath, notificationTopic) => async (
  root,
  args,
  context
) => {
  // get object from path
  const data = get(args, inputPath);
  // get creator from path
  const creator = get(context, creatorPath);
  // createObject
  const record = await creator(data);
  // notifyPubsub
  await context.pubsub.publish(notificationTopic, record);
  // return object
  return record;
};

module.exports = addOneHOR;
