require('dotenv').config();

const { Kafka, Partitioners } = require("kafkajs");
const { uid } = require("uid");

const topic = {
  PURCHASE: "purchase",
  PURCHASE_FAIL: "purchaseFail",
  CHECK_STOCK: "checkStock",
  CHECK_STOCK_FAIL: "checkStockFail",
  NOTIFICATION: "notification",
  NOTIFICATION_RESULT: "notificationResult",
};

const client = new Kafka({
  brokers: [process.env.KAFKA_BROKERS],
  clientId: uid(),
});

const clientProducer = client.producer({ createPartitioner: Partitioners.LegacyPartitioner });

const clientConsumer = (groupID) => {
  return client.consumer({ groupId: groupID, rebalanceTimeout: 1000 });
};

module.exports = { topic, clientProducer, clientConsumer };
