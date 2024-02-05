const { clientConsumer,clientProducer  } = require('../config/kafka.js')
const {topic} = require("../config/kafka.js");
const thisService = "notification";

// KafKa
const _clientConsumer = clientConsumer(thisService);

async function initialize() {
  await _clientConsumer.subscribe({
    topic: topic.NOTIFICATION,
  });
  await clientProducer.connect();
  await _clientConsumer.connect();
}

async function handleConsumer(){
    await _clientConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({ topic: topic, value: message.value.toString() });
        var orderDetail = JSON.parse(message.value.toString());
        handleNotification(orderDetail);
      },
    });
  }

async function main()
{
  initialize();
  handleConsumer()
}

main();


async function handleNotification(orderDetail){
    console.log(`Notification to ${orderDetail.id} successful`);

    orderDetail.reason ="Notification success";

    const orderTopic = {
        topic: topic.NOTIFICATION_RESULT,
        messages: [{ value: JSON.stringify(orderDetail) }],
      };
    
      await clientProducer.send(orderTopic);

}