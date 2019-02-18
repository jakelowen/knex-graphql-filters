const get = require("lodash.get");

const removeOneHOR = (deletorPath, recordIdPath, notificationTopic) => async (
  root,
  args,
  context
) => {
  // get creator from path
  const deletor = get(context, deletorPath);
  // get recordId from path
  const recordId = get(args, recordIdPath);
  // delete Record
  try {
    await deletor(recordId);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log("error in removeOne HOR", e);
  }

  // notifyPubsub
  await context.pubsub.publish(notificationTopic, { recordId });
  // return object
  return true;
};

module.exports = removeOneHOR;
